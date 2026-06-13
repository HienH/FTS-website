import { describe, it, expect } from "vitest";
import { computeFinances, UEFA_RULE } from "../finance";
import {
  windowReducer,
  initialWindowState,
  parseWindowState,
  clampAmortYears,
  type WindowState,
  type Transaction,
} from "../window-state";
import type { BundleClub, BundlePlayer } from "../bundle-types";

const club: BundleClub = {
  id: "c1",
  leagueId: "GB1",
  name: "Test FC",
  crest: "",
  squadValue: 500_000_000,
  wageBillAnnual: 100_000_000,
  wageBillCoverage: 1,
  revenue: { value: 400_000_000, estimated: false },
  budget: { value: 80_000_000, estimated: true, overridden: false },
};

const squadPlayer = (id: string, wage: number): BundlePlayer => ({
  id,
  clubId: "c1",
  name: `Player ${id}`,
  position: "Centre-Forward",
  age: 25,
  nationality: ["England"],
  contractEnd: "2028-06-30",
  marketValue: 30_000_000,
  wageAnnual: { value: wage, estimated: false },
});

const squad = [squadPlayer("p1", 10_000_000), squadPlayer("p2", 5_000_000)];

const tx = (playerId: string, over: Partial<Transaction> = {}): Transaction => ({
  playerId,
  fee: 50_000_000,
  wage: 8_000_000,
  contractYears: 4,
  amortYears: 4,
  ...over,
});

const stateWith = (over: Partial<WindowState>): WindowState => ({
  ...initialWindowState,
  clubId: "c1",
  ...over,
});

describe("computeFinances", () => {
  it("baseline: no transactions", () => {
    const f = computeFinances(club, squad, stateWith({}));
    expect(f.totalWages).toBe(100_000_000);
    expect(f.totalAmortisation).toBe(0);
    expect(f.agentFees).toBe(0);
    expect(f.profitOnSales).toBe(0);
    expect(f.squadCostRatio).toBeCloseTo(0.25);
    expect(f.compliant).toBe(true);
    expect(f.spent).toBe(0);
    expect(f.budgetRemaining).toBe(80_000_000);
  });

  it("signing adds wage, amortisation, agent fee", () => {
    const f = computeFinances(club, squad, stateWith({ signings: [tx("new1")] }));
    expect(f.totalWages).toBe(108_000_000);
    expect(f.totalAmortisation).toBe(12_500_000); // 50m / 4
    expect(f.agentFees).toBe(2_500_000); // 5% of 50m
    expect(f.spent).toBe(50_000_000);
  });

  it("sale removes squad wage, adds profit, reduces net spend", () => {
    const sale = tx("p1", { fee: 40_000_000 });
    const f = computeFinances(club, squad, stateWith({ sales: [sale] }));
    expect(f.totalWages).toBe(90_000_000); // p1 wage gone
    expect(f.profitOnSales).toBe(40_000_000);
    expect(f.spent).toBe(-40_000_000);
    expect(f.squadCostRatio).toBeCloseTo((90_000_000 + 2_000_000) / 440_000_000);
  });

  it("amortisation period is capped at 5 even for 8-year contracts", () => {
    const f = computeFinances(
      club,
      squad,
      stateWith({ signings: [tx("new1", { contractYears: 8, amortYears: 8 })] }),
    );
    expect(f.totalAmortisation).toBe(10_000_000); // 50m / 5, never /8
  });

  it("zero fee signing: no amortisation, no agent fee, wage still counts", () => {
    const f = computeFinances(
      club,
      squad,
      stateWith({ signings: [tx("free1", { fee: 0 })] }),
    );
    expect(f.totalAmortisation).toBe(0);
    expect(f.agentFees).toBe(0);
    expect(f.totalWages).toBe(108_000_000);
  });

  it("non-compliant past 70%", () => {
    const big = tx("g1", { fee: 800_000_000, wage: 100_000_000, amortYears: 5 });
    const f = computeFinances(club, squad, stateWith({ signings: [big] }));
    expect(f.squadCostRatio).toBeGreaterThan(UEFA_RULE.threshold);
    expect(f.compliant).toBe(false);
  });

  it("over budget flags but is a number, never throws", () => {
    const f = computeFinances(
      club,
      squad,
      stateWith({ signings: [tx("g1", { fee: 200_000_000 })] }),
    );
    expect(f.overBudget).toBe(true);
    expect(f.budgetRemaining).toBe(-120_000_000);
  });

  it("zero revenue and no sales -> ratio is Infinity, not NaN", () => {
    const broke = { ...club, revenue: { value: 0, estimated: true } };
    const f = computeFinances(broke, squad, stateWith({}));
    expect(f.squadCostRatio).toBe(Infinity);
    expect(f.compliant).toBe(false);
  });
});

describe("windowReducer", () => {
  it("sign/sell dedupe by playerId", () => {
    let s = stateWith({});
    s = windowReducer(s, { type: "sign", tx: tx("a") });
    s = windowReducer(s, { type: "sign", tx: tx("a") });
    expect(s.signings).toHaveLength(1);
  });

  it("changing club resets transactions", () => {
    let s = stateWith({ signings: [tx("a")] });
    s = windowReducer(s, { type: "selectClub", clubId: "c2" });
    expect(s.clubId).toBe("c2");
    expect(s.signings).toHaveLength(0);
  });

  it("edit clamps amortYears to 1..5", () => {
    let s = stateWith({ signings: [tx("a")] });
    s = windowReducer(s, { type: "editSigning", playerId: "a", patch: { amortYears: 9 } });
    expect(s.signings[0].amortYears).toBe(5);
    s = windowReducer(s, { type: "editSigning", playerId: "a", patch: { amortYears: 0 } });
    expect(s.signings[0].amortYears).toBe(1);
  });
});

describe("state serialization", () => {
  it("round-trips through JSON", () => {
    const s = stateWith({ signings: [tx("a")], sales: [tx("p1", { fee: 12_345 })] });
    expect(parseWindowState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("rejects wrong version and malformed blobs", () => {
    expect(parseWindowState({ ...stateWith({}), v: 99 })).toBeNull();
    expect(parseWindowState(null)).toBeNull();
    expect(parseWindowState({ v: 1, clubId: "c1", signings: [{ bad: true }], sales: [] })).toBeNull();
  });

  it("clampAmortYears handles NaN", () => {
    expect(clampAmortYears(NaN)).toBe(1);
  });
});
