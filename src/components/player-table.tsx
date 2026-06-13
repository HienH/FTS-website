"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { BundlePlayer } from "@/lib/bundle-types";
import { EstMarker, PositionBadge } from "./ui";
import { fmtMoney, fmtDate } from "@/lib/format";

type SortKey = "name" | "position" | "age" | "marketValue" | "wage" | "contractEnd";

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Name" },
  { key: "position", label: "Pos" },
  { key: "age", label: "Age", numeric: true },
  { key: "marketValue", label: "Value", numeric: true },
  { key: "wage", label: "Wage / yr", numeric: true },
  { key: "contractEnd", label: "Contract" },
];

function sortValue(p: BundlePlayer, key: SortKey): string | number {
  switch (key) {
    case "name": return p.name;
    case "position": return p.position;
    case "age": return p.age ?? -1;
    case "marketValue": return p.marketValue;
    case "wage": return p.wageAnnual.value;
    case "contractEnd": return p.contractEnd ?? "";
  }
}

export function PlayerTable({
  players,
  action,
  clubName,
  defaultSort = "marketValue",
}: {
  players: BundlePlayer[];
  action: (p: BundlePlayer) => ReactNode;
  clubName?: (p: BundlePlayer) => string | undefined;
  defaultSort?: SortKey;
}) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort);
  const [sortAsc, setSortAsc] = useState(defaultSort === "name");

  const positions = useMemo(
    () => [...new Set(players.map((p) => p.position))].sort(),
    [players],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = players.filter(
      (p) =>
        (position === "all" || p.position === position) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
    return filtered.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
  }, [players, query, position, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "name" || key === "position");
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          placeholder="Search players…"
          aria-label="Search players"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border border-edge-2 bg-panel-2 px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-accent focus:outline-none sm:max-w-xs"
        />
        <select
          aria-label="Filter by position"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-md border border-edge-2 bg-panel-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="all">All positions</option>
          {positions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="max-h-[75vh] overflow-auto rounded-xl border border-edge">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-panel text-xs uppercase tracking-wide text-zinc-400 shadow-[0_1px_0_var(--color-edge)]">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={`px-3 py-2.5 ${c.numeric ? "text-right" : ""}`}
                  aria-sort={sortKey === c.key ? (sortAsc ? "ascending" : "descending") : undefined}
                >
                  <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 font-semibold uppercase hover:text-white">
                    {c.label}
                    {sortKey === c.key && <span aria-hidden>{sortAsc ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
              {clubName && <th scope="col" className="px-3 py-2.5">Club</th>}
              <th scope="col" className="px-3 py-2.5"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge/60">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-panel">
                <td className="px-3 py-2 font-medium text-zinc-100">{p.name}</td>
                <td className="px-3 py-2"><PositionBadge position={p.position} /></td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-300">{p.age ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-100">
                  {p.marketValue > 0 ? fmtMoney(p.marketValue) : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-zinc-300">
                  {fmtMoney(p.wageAnnual.value)}
                  <EstMarker estimated={p.wageAnnual.estimated} />
                </td>
                <td className="px-3 py-2 text-zinc-400">{fmtDate(p.contractEnd)}</td>
                {clubName && <td className="px-3 py-2 text-zinc-400">{clubName(p)}</td>}
                <td className="px-3 py-2 text-right">{action(p)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + (clubName ? 2 : 1)} className="px-3 py-8 text-center text-zinc-500">
                  No players match
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-zinc-500">{rows.length} players</p>
    </div>
  );
}
