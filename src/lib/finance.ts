import type { BundleClub, BundlePlayer } from "./bundle-types";
import type { WindowState } from "./window-state";
import { clampAmortYears } from "./window-state";

/**
 * Per-league squad cost rule config. MVP ships UEFA only; PL SCR (85%) and
 * La Liga squad limit drop in here later as additional entries.
 */
export interface SquadCostRule {
  label: string;
  threshold: number; // ratio, e.g. 0.70
  agentFeeRate: number; // flat MVP assumption
}

export const UEFA_RULE: SquadCostRule = {
  label: "UEFA squad cost rule (70%)",
  threshold: 0.7,
  agentFeeRate: 0.05,
};

export const RULES_BY_LEAGUE: Record<string, SquadCostRule> = {
  // every league uses the UEFA rule in MVP; per-league overrides slot in here
  default: UEFA_RULE,
};

export const ruleForLeague = (leagueId: string): SquadCostRule =>
  RULES_BY_LEAGUE[leagueId] ?? RULES_BY_LEAGUE.default;

export interface FinanceSummary {
  // squad cost ratio components
  totalWages: number;
  totalAmortisation: number;
  agentFees: number;
  revenue: number;
  profitOnSales: number;
  squadCostRatio: number; // Infinity if denominator <= 0
  compliant: boolean;
  rule: SquadCostRule;
  // budget
  spent: number; // signing fees - sale fees (net spend)
  budget: number;
  budgetRemaining: number;
  overBudget: boolean;
}

/**
 * The one pure function. MVP simplifications (stated in UI tooltips):
 * existing squad's historical amortisation excluded; sales counted at full
 * fee as profit (book values assumed zero); agent fees flat 5% of fees.
 */
export function computeFinances(
  club: BundleClub,
  squad: BundlePlayer[],
  state: WindowState,
  rule: SquadCostRule = ruleForLeague(club.leagueId),
): FinanceSummary {
  const soldIds = new Set(state.sales.map((t) => t.playerId));
  const soldWages = squad
    .filter((p) => soldIds.has(p.id))
    .reduce((sum, p) => sum + p.wageAnnual.value, 0);
  const signedWages = state.signings.reduce((sum, t) => sum + t.wage, 0);
  const totalWages = club.wageBillAnnual - soldWages + signedWages;

  const totalAmortisation = state.signings.reduce(
    (sum, t) => sum + t.fee / clampAmortYears(t.amortYears),
    0,
  );

  const feesIn = state.signings.reduce((sum, t) => sum + t.fee, 0);
  const feesOut = state.sales.reduce((sum, t) => sum + t.fee, 0);
  const agentFees = rule.agentFeeRate * (feesIn + feesOut);
  const profitOnSales = feesOut;
  const revenue = club.revenue.value;

  const denominator = revenue + profitOnSales;
  const numerator = totalWages + totalAmortisation + agentFees;
  const squadCostRatio = denominator > 0 ? numerator / denominator : Infinity;

  const spent = feesIn - feesOut;
  const budget = club.budget.value;

  return {
    totalWages,
    totalAmortisation,
    agentFees,
    revenue,
    profitOnSales,
    squadCostRatio,
    compliant: squadCostRatio <= rule.threshold,
    rule,
    spent,
    budget,
    budgetRemaining: budget - spent,
    overBudget: spent > budget,
  };
}
