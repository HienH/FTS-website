/** Compact EUR display: €1.25bn, €45m, €750k, €0. */
export function fmtMoney(eur: number): string {
  const sign = eur < 0 ? "-" : "";
  const abs = Math.abs(eur);
  if (abs >= 1_000_000_000) return `${sign}€${trim(abs / 1_000_000_000)}bn`;
  if (abs >= 1_000_000) return `${sign}€${trim(abs / 1_000_000)}m`;
  if (abs >= 1_000) return `${sign}€${trim(abs / 1_000)}k`;
  return `${sign}€${abs}`;
}

function trim(n: number): string {
  return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");
}

export function fmtPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}
