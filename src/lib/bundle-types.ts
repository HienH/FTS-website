/**
 * Bundle data contract — copied verbatim from fts-data-pipeline/src/types.ts.
 * Do not edit by hand; refresh via `npm run sync:data`.
 */

/** Final bundle consumed by the FTS web app. All money in integer EUR. */

export interface Bundle {
  version: number;
  generatedAt: string;
  season: string;
  currency: "EUR";
  sources: { values: string; wages: string };
  leagues: BundleLeague[];
  clubs: BundleClub[];
  players: BundlePlayer[];
}

export interface BundleLeague {
  id: string;
  key: string;
  name: string;
  country: string;
}

export interface BundleClub {
  id: string; // == Transfermarkt club id (stable across refreshes)
  leagueId: string;
  name: string;
  crest: string;
  stadiumName?: string;
  squadValue: number;
  wageBillAnnual: number; // sum of matched player wages
  wageBillCoverage: number; // 0..1, fraction of squad with a real wage match
  revenue: { value: number; estimated: boolean };
  budget: { value: number; estimated: boolean; overridden: boolean };
}

export interface BundlePlayer {
  id: string; // == Transfermarkt player id (stable across refreshes)
  clubId: string;
  name: string;
  position: string;
  age: number | null;
  nationality: string[];
  contractEnd: string | null; // ISO date
  marketValue: number; // EUR, 0 if unknown
  wageAnnual: { value: number; estimated: boolean }; // EUR gross
  foot?: string;
  height?: number;
}
