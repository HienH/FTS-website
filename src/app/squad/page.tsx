"use client";

import Link from "next/link";
import { useFts } from "@/components/fts-provider";
import { PlayerTable } from "@/components/player-table";
import { fmtMoney } from "@/lib/format";
import { NoClub } from "@/components/no-club";

export default function SquadPage() {
  const { club, squad, state, dispatch } = useFts();
  if (!club) return <NoClub />;

  const soldIds = new Set(state.sales.map((t) => t.playerId));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-white">{club.name} squad</h1>
        {state.sales.length > 0 && (
          <p className="text-sm text-zinc-400">
            {state.sales.length} sold ·{" "}
            <Link href="/transfers?tab=sold" className="text-accent underline hover:text-accent-bright">
              edit sales
            </Link>
          </p>
        )}
      </div>
      <PlayerTable
        players={squad}
        action={(p) =>
          soldIds.has(p.id) ? (
            <button
              onClick={() => dispatch({ type: "removeSale", playerId: p.id })}
              className="whitespace-nowrap rounded-md border border-edge-2 px-2.5 py-1 text-xs font-semibold text-zinc-400 hover:bg-panel-2"
              title="Undo sale"
            >
              Sold · undo
            </button>
          ) : (
            <button
              onClick={() =>
                dispatch({
                  type: "sell",
                  tx: {
                    playerId: p.id,
                    fee: p.marketValue,
                    wage: p.wageAnnual.value,
                    contractYears: 0,
                    amortYears: 1,
                  },
                })
              }
              className="rounded-md bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300 hover:bg-red-500/25"
              title={`Sell for ${fmtMoney(p.marketValue)}`}
            >
              Sell
            </button>
          )
        }
      />
    </div>
  );
}
