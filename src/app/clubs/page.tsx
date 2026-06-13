"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFts } from "@/components/fts-provider";
import { EstMarker } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import type { BundleClub } from "@/lib/bundle-types";

export default function ClubSelectPage() {
  const { index, dispatch } = useFts();
  const router = useRouter();
  const leagues = index.bundle.leagues;
  const [leagueId, setLeagueId] = useState(leagues[0]?.id ?? "");
  const [preview, setPreview] = useState<BundleClub | null>(null);

  const clubs = index.clubsByLeague.get(leagueId) ?? [];

  const choose = (club: BundleClub) => {
    dispatch({ type: "selectClub", clubId: club.id });
    router.push("/dashboard");
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-white">Pick your club</h1>

      <div role="tablist" aria-label="League" className="mb-5 flex gap-1 overflow-x-auto border-b border-edge">
        {leagues.map((l) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={l.id === leagueId}
            onClick={() => {
              setLeagueId(l.id);
              setPreview(null);
            }}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${
              l.id === leagueId
                ? "border-accent text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <ul className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" role="list">
          {clubs.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setPreview(c)}
                onDoubleClick={() => choose(c)}
                className={`flex w-full flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                  preview?.id === c.id
                    ? "border-accent bg-accent/10"
                    : "border-edge bg-panel hover:border-edge-2 hover:bg-panel-2"
                }`}
              >
                {/* crest URLs come from the bundle (external CDN), tiny images — plain img on purpose */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.crest} alt="" width={48} height={48} className="h-12 w-12 object-contain" loading="lazy" />
                <span className="text-sm font-medium leading-tight">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <aside className="lg:w-80" aria-live="polite">
          {preview ? (
            <div className="sticky top-16 rounded-xl border border-edge bg-panel p-5">
              <div className="mb-4 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.crest} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
                <h2 className="text-lg font-bold text-white">{preview.name}</h2>
              </div>
              <dl className="space-y-2.5 text-sm">
                <Row label="Transfer budget">
                  {fmtMoney(preview.budget.value)}
                  <EstMarker estimated={preview.budget.estimated} />
                </Row>
                <Row label="Wage bill (annual)">{fmtMoney(preview.wageBillAnnual)}</Row>
                <Row label="Squad value">{fmtMoney(preview.squadValue)}</Row>
                <Row label="Revenue">
                  {fmtMoney(preview.revenue.value)}
                  <EstMarker estimated={preview.revenue.estimated} />
                </Row>
              </dl>
              <button
                onClick={() => choose(preview)}
                className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-accent-bright"
              >
                Manage {preview.name}
              </button>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-edge-2 p-5 text-center text-sm text-zinc-500">
              Select a club to preview its finances
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums text-zinc-100">{children}</dd>
    </div>
  );
}
