"use client";

import Link from "next/link";

export function NoClub() {
  return (
    <div className="py-16 text-center">
      <p className="mb-4 text-zinc-400">Pick a club first.</p>
      <Link
        href="/clubs"
        className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-accent-bright"
      >
        Choose a club
      </Link>
    </div>
  );
}
