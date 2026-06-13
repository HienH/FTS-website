"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFts } from "./fts-provider";
import { UefaPill } from "./ui";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/squad", label: "Squad" },
  { href: "/transfers", label: "Transfers" },
  { href: "/finances", label: "Finances" },
];

export function Nav() {
  const pathname = usePathname();
  const { club, finances } = useFts();

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 md:px-6">
        <Link href="/" className="shrink-0 font-mono text-lg font-black tracking-tight text-white">
          FTS<span className="text-accent">_</span>
        </Link>
        {club && (
          <nav aria-label="Main" className="-mb-px flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === l.href
                    ? "bg-panel-2 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {finances && <UefaPill finances={finances} />}
          <Link
            href="/clubs"
            className="whitespace-nowrap rounded-md border border-edge-2 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-panel-2 hover:text-white"
          >
            {club ? "Switch club" : "Pick a club"}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-edge px-4 py-4 text-center text-xs text-zinc-500">
      Values: Transfermarkt · Wages: Capology via FBref
    </footer>
  );
}
