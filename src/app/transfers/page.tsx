"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFts } from "@/components/fts-provider";
import { PlayerTable } from "@/components/player-table";
import { NoClub } from "@/components/no-club";
import { MoneyInput, EstMarker, PositionBadge } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import type { Transaction } from "@/lib/window-state";
import type { BundlePlayer } from "@/lib/bundle-types";

const TABS = [
  { id: "market", label: "Market" },
  { id: "bought", label: "Bought" },
  { id: "sold", label: "Sold" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function TransfersPage() {
  return (
    <Suspense>
      <Transfers />
    </Suspense>
  );
}

function Transfers() {
  const { club, state } = useFts();
  const initialTab = useSearchParams().get("tab");
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? (initialTab as TabId) : "market",
  );
  if (!club) return <NoClub />;

  const counts: Record<TabId, number | null> = {
    market: null,
    bought: state.signings.length,
    sold: state.sales.length,
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-white">Transfers</h1>
      <div role="tablist" aria-label="Transfers" className="mb-5 flex gap-1 border-b border-edge">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.id
                ? "border-accent text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t.label}
            {counts[t.id] !== null && counts[t.id]! > 0 && (
              <span className="ml-1.5 rounded-full bg-panel-2 px-1.5 py-0.5 font-mono text-xs tabular-nums">
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "market" && <MarketTab />}
      {tab === "bought" && <BoughtTab />}
      {tab === "sold" && <SoldTab />}
    </div>
  );
}

function MarketTab() {
  const { index, state, dispatch } = useFts();
  const signedIds = useMemo(() => new Set(state.signings.map((t) => t.playerId)), [state.signings]);
  const market = useMemo(
    () => index.bundle.players.filter((p) => p.clubId !== state.clubId),
    [index, state.clubId],
  );

  return (
    <PlayerTable
      players={market}
      clubName={(p) => index.clubById.get(p.clubId)?.name}
      action={(p) =>
        signedIds.has(p.id) ? (
          <button
            onClick={() => dispatch({ type: "removeSigning", playerId: p.id })}
            className="whitespace-nowrap rounded-md border border-edge-2 px-2.5 py-1 text-xs font-semibold text-zinc-400 hover:bg-panel-2"
            title="Undo signing"
          >
            Signed · undo
          </button>
        ) : (
          <button
            onClick={() =>
              dispatch({
                type: "sign",
                tx: {
                  playerId: p.id,
                  fee: p.marketValue,
                  wage: p.wageAnnual.value,
                  contractYears: 4,
                  amortYears: 4, // min(contract 4y, UEFA 5y cap)
                },
              })
            }
            className="rounded-md bg-accent px-2.5 py-1 text-xs font-bold text-zinc-950 hover:bg-accent-bright"
            title={`Sign for ${fmtMoney(p.marketValue)}`}
          >
            Sign
          </button>
        )
      }
    />
  );
}

function TxCard({
  player,
  tx,
  clubName,
  onEdit,
  onRemove,
  isSigning,
}: {
  player: BundlePlayer;
  tx: Transaction;
  clubName?: string;
  onEdit: (patch: Partial<Omit<Transaction, "playerId">>) => void;
  onRemove: () => void;
  isSigning: boolean;
}) {
  return (
    <li className="rounded-xl border border-edge bg-panel p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white">{player.name}</h3>
          <p className="text-xs text-zinc-400">
            <PositionBadge position={player.position} />
            {clubName ? ` · ${clubName}` : ""} · value{" "}
            <span className="font-mono tabular-nums">{fmtMoney(player.marketValue)}</span> · wage{" "}
            <span className="font-mono tabular-nums">{fmtMoney(player.wageAnnual.value)}</span>
            <EstMarker estimated={player.wageAnnual.estimated} />
          </p>
        </div>
        <button
          onClick={onRemove}
          className="rounded-md border border-edge-2 px-2 py-1 text-xs text-zinc-400 hover:bg-panel-2"
        >
          Remove
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MoneyInput
          id={`fee-${tx.playerId}`}
          label={isSigning ? "Transfer fee" : "Sale fee"}
          value={tx.fee}
          onChange={(fee) => onEdit({ fee })}
        />
        {isSigning && (
          <>
            <MoneyInput
              id={`wage-${tx.playerId}`}
              label="Wage / year"
              value={tx.wage}
              onChange={(wage) => onEdit({ wage })}
            />
            <label htmlFor={`contract-${tx.playerId}`} className="block">
              <span className="mb-1 block text-xs text-zinc-400">Contract (years)</span>
              <input
                id={`contract-${tx.playerId}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={tx.contractYears}
                onChange={(e) => {
                  const contractYears = Math.max(1, Math.round(Number(e.target.value) || 1));
                  onEdit({ contractYears, amortYears: Math.min(contractYears, 5) });
                }}
                className="w-full rounded-md border border-edge-2 bg-panel-2 px-2 py-1.5 font-mono text-sm tabular-nums focus:border-accent focus:outline-none"
              />
            </label>
            <label htmlFor={`amort-${tx.playerId}`} className="block">
              <span className="mb-1 block text-xs text-zinc-400">
                Amortisation (max 5 yrs)
              </span>
              <select
                id={`amort-${tx.playerId}`}
                value={tx.amortYears}
                onChange={(e) => onEdit({ amortYears: Number(e.target.value) })}
                className="w-full rounded-md border border-edge-2 bg-panel-2 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y} disabled={y > Math.min(tx.contractYears, 5)}>
                    {y} {y === 1 ? "year" : "years"} — {fmtMoney(Math.round(tx.fee / y))}/yr
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </li>
  );
}

function BoughtTab() {
  const { index, state, dispatch } = useFts();
  if (state.signings.length === 0)
    return <Empty text="No signings yet — head to the Market tab." />;
  return (
    <ul className="space-y-3">
      {state.signings.map((tx) => {
        const player = index.playerById.get(tx.playerId);
        if (!player) return null;
        return (
          <TxCard
            key={tx.playerId}
            player={player}
            tx={tx}
            clubName={index.clubById.get(player.clubId)?.name}
            isSigning
            onEdit={(patch) => dispatch({ type: "editSigning", playerId: tx.playerId, patch })}
            onRemove={() => dispatch({ type: "removeSigning", playerId: tx.playerId })}
          />
        );
      })}
    </ul>
  );
}

function SoldTab() {
  const { index, state, dispatch } = useFts();
  if (state.sales.length === 0)
    return <Empty text="No sales yet — sell players from the Squad page." />;
  return (
    <ul className="space-y-3">
      {state.sales.map((tx) => {
        const player = index.playerById.get(tx.playerId);
        if (!player) return null;
        return (
          <TxCard
            key={tx.playerId}
            player={player}
            tx={tx}
            isSigning={false}
            onEdit={(patch) => dispatch({ type: "editSale", playerId: tx.playerId, patch })}
            onRemove={() => dispatch({ type: "removeSale", playerId: tx.playerId })}
          />
        );
      })}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-edge-2 p-8 text-center text-sm text-zinc-500">
      {text}
    </p>
  );
}
