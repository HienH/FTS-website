"use client";

import { useState } from "react";
import Link from "next/link";
import { useFts } from "@/components/fts-provider";
import { NoClub } from "@/components/no-club";
import { UefaPill, BudgetBar, EstMarker } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import { shareTransport } from "@/lib/share";

export default function DashboardPage() {
  const { club, finances, state, squad } = useFts();
  const [copied, setCopied] = useState(false);
  if (!club || !finances) return <NoClub />;

  const share = async () => {
    const url = await shareTransport.encode(state);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-edge bg-panel p-5 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={club.crest} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white">{club.name}</h1>
          <p className="text-sm text-zinc-400">
            Squad value <span className="font-mono tabular-nums text-zinc-300">{fmtMoney(club.squadValue)}</span> ·{" "}
            {squad.length} players · revenue{" "}
            <span className="font-mono tabular-nums text-zinc-300">{fmtMoney(club.revenue.value)}</span>
            <EstMarker estimated={club.revenue.estimated} />
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <UefaPill finances={finances} />
          <button
            onClick={share}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-accent-bright"
          >
            {copied ? "Link copied!" : "Share window"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-edge bg-panel p-5">
        <BudgetBar finances={finances} />
      </section>

      <nav aria-label="Sections" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          href="/squad"
          title="Squad"
          desc={`${squad.length} players · ${state.sales.length} sold`}
        />
        <Card
          href="/transfers"
          title="Transfers"
          desc={`${state.signings.length} signed · market open`}
        />
        <Card
          href="/finances"
          title="Finances"
          desc={
            finances.squadCostRatio === Infinity
              ? "Squad cost breakdown"
              : `Squad cost at ${(finances.squadCostRatio * 100).toFixed(1)}%`
          }
        />
      </nav>
    </div>
  );
}

function Card({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-edge bg-panel p-5 transition-colors hover:border-accent hover:bg-panel-2"
    >
      <h2 className="mb-1 font-semibold text-white">{title}</h2>
      <p className="text-sm text-zinc-400">{desc}</p>
    </Link>
  );
}
