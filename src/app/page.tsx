"use client";

import Link from "next/link";
import { useFts } from "@/components/fts-provider";

export default function HomePage() {
  const { club, index } = useFts();
  const { leagues, clubs, players } = index.bundle;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center md:py-28">
      <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-accent">
        Transfer window · sandbox
      </p>
      <h1 className="mb-4 max-w-2xl text-4xl font-black tracking-tight text-white md:text-5xl">
        Build your dream transfer window.
      </h1>
      <p className="mb-8 max-w-xl text-zinc-400">
        Pick a real club from Europe&apos;s big five leagues, sign and sell with real market
        values and wages, and watch the budget and UEFA squad cost rule react in real time.
        Nothing stops you — the tool just shows the consequences.
      </p>
      <Link
        href={club ? "/dashboard" : "/clubs"}
        className="rounded-xl bg-accent px-8 py-3.5 text-base font-bold text-zinc-950 hover:bg-accent-bright"
      >
        {club ? "Back to your window" : "Pick your club"}
      </Link>
      <dl className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
        <Stat value={leagues.length} label="Leagues" />
        <Stat value={clubs.length} label="Clubs" />
        <Stat value={players.length} label="Players" />
      </dl>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dd className="font-mono text-3xl font-black tabular-nums text-white">{value}</dd>
      <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
    </div>
  );
}
