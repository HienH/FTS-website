"use client";

import { fmtMoney, fmtPercent } from "@/lib/format";
import type { FinanceSummary } from "@/lib/finance";

export function EstMarker({ estimated }: { estimated: boolean }) {
  if (!estimated) return null;
  return (
    <abbr
      title="Estimated value"
      className="ml-1 rounded bg-amber-400/15 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-amber-300 no-underline"
    >
      est.
    </abbr>
  );
}

export function UefaPill({ finances }: { finances: FinanceSummary }) {
  const { squadCostRatio, rule } = finances;
  // RAG with an explicit warning band: amber from 90% of the threshold up
  const state =
    squadCostRatio === Infinity
      ? ("na" as const)
      : squadCostRatio > rule.threshold
        ? ("over" as const)
        : squadCostRatio >= rule.threshold * 0.9
          ? ("warn" as const)
          : ("safe" as const);

  const styles = {
    safe: "bg-emerald-400/10 text-emerald-300",
    warn: "bg-amber-400/10 text-amber-300",
    over: "bg-red-400/10 text-red-300",
    na: "bg-panel-2 text-zinc-400",
  }[state];
  const dot = {
    safe: "bg-emerald-400",
    warn: "bg-amber-400",
    over: "bg-red-400",
    na: "bg-zinc-500",
  }[state];
  const label = {
    safe: "UEFA compliant",
    warn: `At risk · ${fmtPercent(squadCostRatio)}`,
    over: `Over limit · ${fmtPercent(squadCostRatio)}`,
    na: "Squad cost rule: n/a",
  }[state];

  return (
    <span
      title={rule.label}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 font-mono text-xs font-semibold tabular-nums ${styles}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function BudgetBar({ finances }: { finances: FinanceSummary }) {
  const { spent, budget, overBudget } = finances;
  const pct = budget > 0 ? Math.min(Math.max(spent / budget, 0), 1) * 100 : spent > 0 ? 100 : 0;
  const state = overBudget ? "over" : pct >= 80 ? "warn" : "safe";
  const bar = { safe: "bg-emerald-400", warn: "bg-amber-400", over: "bg-red-500" }[state];
  const label = { safe: "Safe", warn: "At risk", over: "Over budget" }[state];
  const labelColor = {
    safe: "text-emerald-300",
    warn: "text-amber-300",
    over: "text-red-300",
  }[state];

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-zinc-400">
          Net spend · <span className={`font-semibold ${labelColor}`}>{label}</span>
        </span>
        <span className={`font-mono tabular-nums ${overBudget ? "font-semibold text-red-300" : "font-medium text-zinc-200"}`}>
          {fmtMoney(spent)} / {fmtMoney(budget)}
        </span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={Math.max(spent, 0)}
        aria-valuetext={`${fmtMoney(spent)} of ${fmtMoney(budget)} — ${label}`}
        aria-label="Transfer budget used"
        className="h-2.5 overflow-hidden rounded-full bg-panel-2"
      >
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const POSITION_META: Record<string, { code: string; group: "GK" | "DEF" | "MID" | "FWD" }> = {
  Goalkeeper: { code: "GK", group: "GK" },
  "Centre-Back": { code: "CB", group: "DEF" },
  "Left-Back": { code: "LB", group: "DEF" },
  "Right-Back": { code: "RB", group: "DEF" },
  "Defensive Midfield": { code: "DM", group: "MID" },
  "Central Midfield": { code: "CM", group: "MID" },
  "Attacking Midfield": { code: "AM", group: "MID" },
  "Left Winger": { code: "LW", group: "FWD" },
  "Right Winger": { code: "RW", group: "FWD" },
  "Centre-Forward": { code: "CF", group: "FWD" },
};

const GROUP_STYLES: Record<string, string> = {
  GK: "bg-amber-400/10 text-amber-300",
  DEF: "bg-sky-400/10 text-sky-300",
  MID: "bg-emerald-400/10 text-emerald-300",
  FWD: "bg-rose-400/10 text-rose-300",
};

export function PositionBadge({ position }: { position: string }) {
  const meta = POSITION_META[position];
  if (!meta) return <span className="text-zinc-400">{position}</span>;
  return (
    <abbr
      title={position}
      className={`inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-bold no-underline ${GROUP_STYLES[meta.group]}`}
    >
      {meta.code}
    </abbr>
  );
}

export function MoneyInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (eur: number) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-1">
        <span aria-hidden className="text-sm text-zinc-500">€</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={100000}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
          className="w-full min-w-0 rounded-md border border-edge-2 bg-panel-2 px-2 py-1.5 font-mono text-sm tabular-nums focus:border-accent focus:outline-none"
        />
      </div>
      <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-zinc-500">{fmtMoney(value)}</span>
    </label>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-block align-middle">
      <button
        type="button"
        aria-label={text}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-panel-2 text-[10px] font-bold text-zinc-400"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-1.5 w-56 -translate-x-1/2 rounded-md bg-zinc-100 px-2.5 py-1.5 text-left text-xs font-normal text-zinc-900 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
