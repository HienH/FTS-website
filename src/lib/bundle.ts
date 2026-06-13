import type { Bundle, BundleClub, BundlePlayer } from "./bundle-types";

export const KNOWN_BUNDLE_VERSIONS = [1];

export class UnknownBundleVersionError extends Error {
  constructor(public version: unknown) {
    super(`Unknown bundle version: ${version}. This app understands versions ${KNOWN_BUNDLE_VERSIONS.join(", ")}.`);
  }
}

export async function loadBundle(url = "/bundle.json"): Promise<Bundle> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load bundle: ${res.status}`);
  const data = (await res.json()) as Bundle;
  if (!KNOWN_BUNDLE_VERSIONS.includes(data.version)) {
    throw new UnknownBundleVersionError(data.version);
  }
  return data;
}

/** Precomputed lookups so pages never scan the full player array per render. */
export interface BundleIndex {
  bundle: Bundle;
  clubById: Map<string, BundleClub>;
  playerById: Map<string, BundlePlayer>;
  playersByClub: Map<string, BundlePlayer[]>;
  clubsByLeague: Map<string, BundleClub[]>;
}

export function indexBundle(bundle: Bundle): BundleIndex {
  const clubById = new Map(bundle.clubs.map((c) => [c.id, c]));
  const playerById = new Map(bundle.players.map((p) => [p.id, p]));
  const playersByClub = new Map<string, BundlePlayer[]>();
  for (const p of bundle.players) {
    const list = playersByClub.get(p.clubId);
    if (list) list.push(p);
    else playersByClub.set(p.clubId, [p]);
  }
  const clubsByLeague = new Map<string, BundleClub[]>();
  for (const c of bundle.clubs) {
    const list = clubsByLeague.get(c.leagueId);
    if (list) list.push(c);
    else clubsByLeague.set(c.leagueId, [c]);
  }
  return { bundle, clubById, playerById, playersByClub, clubsByLeague };
}
