"use client";

import { useFts } from "@/components/fts-provider";
import { NoClub } from "@/components/no-club";
import { UefaPill, BudgetBar, EstMarker, InfoTip } from "@/components/ui";
import { fmtMoney, fmtPercent } from "@/lib/format";
import { clampAmortYears } from "@/lib/window-state";

export default function FinancesPage() {
  const { club, finances, state, index } = useFts();
  if (!club || !finances) return <NoClub />;

  const f = finances;
  const numerator = f.totalWages + f.totalAmortisation + f.agentFees;
  const denominator = f.revenue + f.profitOnSales;
  const ratioColor =
    f.squadCostRatio === Infinity
      ? "text-zinc-400"
      : f.squadCostRatio > f.rule.threshold
        ? "text-red-300"
        : f.squadCostRatio >= f.rule.threshold * 0.9
          ? "text-amber-300"
          : "text-emerald-300";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Finances</h1>
        <UefaPill finances={f} />
      </div>

      <section aria-labelledby="scr-heading" className="rounded-xl border border-edge bg-panel p-5">
        <h2 id="scr-heading" className="mb-1 text-lg font-semibold text-white">
          {f.rule.label}
          <InfoTip text="Squad cost ÷ football revenue. Binds clubs in European competition only. MVP simplifications: existing squad's historical transfer amortisation is excluded; sales are counted as profit at full fee (book values assumed zero)." />
        </h2>
        <p className={`mb-5 font-mono text-3xl font-black tabular-nums ${ratioColor}`}>
          {f.squadCostRatio === Infinity ? "n/a" : fmtPercent(f.squadCostRatio)}
          <span className="ml-2 font-sans text-sm font-normal text-zinc-400">
            of the {fmtPercent(f.rule.threshold)} threshold
          </span>
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Squad cost (numerator)
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Total wages" tip="Current squad wage bill, minus sold players' wages, plus new signings' wages (annual gross).">
                {fmtMoney(f.totalWages)}
              </Row>
              <Row label="Transfer amortisation" tip="Each signing's fee spread over its amortisation period (capped at 5 years per UEFA/PL rules). Existing squad's historical amortisation is out of scope for this MVP.">
                {fmtMoney(f.totalAmortisation)}
              </Row>
              <Row label="Agent fees" tip="Flat 5% of every transfer fee (buys and sales) — a transparent MVP assumption.">
                {fmtMoney(f.agentFees)}
              </Row>
              <Total>{fmtMoney(numerator)}</Total>
            </dl>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Football revenue (denominator)
            </h3>
            <dl className="space-y-2 text-sm">
              <Row label="Revenue">
                {fmtMoney(f.revenue)}
                <EstMarker estimated={club.revenue.estimated} />
              </Row>
              <Row label="Profit on sales" tip="Sale fees counted in full — book values are out of scope for this MVP, so sold players are assumed fully amortised." money="in">
                {f.profitOnSales > 0 ? `+${fmtMoney(f.profitOnSales)}` : fmtMoney(f.profitOnSales)}
              </Row>
              <Total>{fmtMoney(denominator)}</Total>
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="budget-heading" className="rounded-xl border border-edge bg-panel p-5">
        <h2 id="budget-heading" className="mb-4 text-lg font-semibold text-white">
          Transfer budget
          <EstMarker estimated={club.budget.estimated} />
        </h2>
        <BudgetBar finances={f} />
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <Row label="Fees out (signings)" money="out">
            {state.signings.length > 0
              ? `−${fmtMoney(state.signings.reduce((s, t) => s + t.fee, 0))}`
              : fmtMoney(0)}
          </Row>
          <Row label="Fees in (sales)" money="in">
            {state.sales.length > 0
              ? `+${fmtMoney(state.sales.reduce((s, t) => s + t.fee, 0))}`
              : fmtMoney(0)}
          </Row>
          <Row label="Remaining">
            <span className={f.overBudget ? "text-red-300" : ""}>{fmtMoney(f.budgetRemaining)}</span>
          </Row>
        </dl>
      </section>

      {state.signings.length > 0 && (
        <section aria-labelledby="signings-heading">
          <h2 id="signings-heading" className="mb-3 text-lg font-semibold text-white">
            Cost per signing
          </h2>
          <div className="overflow-x-auto rounded-xl border border-edge">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-edge bg-panel text-xs uppercase tracking-wide text-zinc-400">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Player</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Fee</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amort / yr</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Wage / yr</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Agent fee</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Annual cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/60">
                {state.signings.map((tx) => {
                  const p = index.playerById.get(tx.playerId);
                  const amort = tx.fee / clampAmortYears(tx.amortYears);
                  return (
                    <tr key={tx.playerId} className="hover:bg-panel">
                      <td className="px-3 py-2 font-medium text-zinc-100">{p?.name ?? tx.playerId}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtMoney(tx.fee)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {fmtMoney(Math.round(amort))}
                        <span className="text-zinc-500"> × {clampAmortYears(tx.amortYears)}y</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtMoney(tx.wage)}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtMoney(Math.round(tx.fee * f.rule.agentFeeRate))}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums text-white">
                        {fmtMoney(Math.round(amort + tx.wage))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  tip,
  money,
  children,
}: {
  label: string;
  tip?: string;
  money?: "in" | "out";
  children: React.ReactNode;
}) {
  const valueColor = money === "in" ? "text-emerald-300" : money === "out" ? "text-red-300" : "text-zinc-200";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-zinc-400">
        {label}
        {tip && <InfoTip text={tip} />}
      </dt>
      <dd className={`font-mono font-medium tabular-nums ${valueColor}`}>{children}</dd>
    </div>
  );
}

function Total({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-edge-2 pt-2">
      <dt className="font-semibold text-white">Total</dt>
      <dd className="font-mono font-bold tabular-nums text-white">{children}</dd>
    </div>
  );
}
