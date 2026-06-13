/** Transfer window state — serializable, versioned, shared via ShareTransport. */

export const WINDOW_STATE_VERSION = 1;

export interface Transaction {
  playerId: string;
  fee: number; // integer EUR
  wage: number; // integer EUR annual
  contractYears: number;
  amortYears: number; // 1..5, UEFA cap
}

export interface WindowState {
  v: number;
  clubId: string | null;
  signings: Transaction[];
  sales: Transaction[];
}

export const initialWindowState: WindowState = {
  v: WINDOW_STATE_VERSION,
  clubId: null,
  signings: [],
  sales: [],
};

export type WindowAction =
  | { type: "selectClub"; clubId: string }
  | { type: "sign"; tx: Transaction }
  | { type: "sell"; tx: Transaction }
  | { type: "editSigning"; playerId: string; patch: Partial<Omit<Transaction, "playerId">> }
  | { type: "editSale"; playerId: string; patch: Partial<Omit<Transaction, "playerId">> }
  | { type: "removeSigning"; playerId: string }
  | { type: "removeSale"; playerId: string }
  | { type: "restore"; state: WindowState }
  | { type: "reset" };

export const clampAmortYears = (years: number) =>
  Math.min(5, Math.max(1, Math.round(years) || 1));

function applyPatch(tx: Transaction, patch: Partial<Omit<Transaction, "playerId">>): Transaction {
  const next = { ...tx, ...patch };
  next.amortYears = clampAmortYears(next.amortYears);
  return next;
}

export function windowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case "selectClub":
      // changing club invalidates all transactions
      return action.clubId === state.clubId
        ? state
        : { ...initialWindowState, clubId: action.clubId };
    case "sign":
      if (state.signings.some((t) => t.playerId === action.tx.playerId)) return state;
      return {
        ...state,
        signings: [...state.signings, { ...action.tx, amortYears: clampAmortYears(action.tx.amortYears) }],
      };
    case "sell":
      if (state.sales.some((t) => t.playerId === action.tx.playerId)) return state;
      return { ...state, sales: [...state.sales, action.tx] };
    case "editSigning":
      return {
        ...state,
        signings: state.signings.map((t) =>
          t.playerId === action.playerId ? applyPatch(t, action.patch) : t,
        ),
      };
    case "editSale":
      return {
        ...state,
        sales: state.sales.map((t) =>
          t.playerId === action.playerId ? applyPatch(t, action.patch) : t,
        ),
      };
    case "removeSigning":
      return { ...state, signings: state.signings.filter((t) => t.playerId !== action.playerId) };
    case "removeSale":
      return { ...state, sales: state.sales.filter((t) => t.playerId !== action.playerId) };
    case "restore":
      return action.state;
    case "reset":
      return initialWindowState;
  }
}

/** Validate a deserialized blob from a share link. Returns null if unusable. */
export function parseWindowState(raw: unknown): WindowState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== WINDOW_STATE_VERSION) return null;
  if (typeof o.clubId !== "string") return null;
  const txOk = (t: unknown): t is Transaction => {
    if (!t || typeof t !== "object") return false;
    const x = t as Record<string, unknown>;
    return (
      typeof x.playerId === "string" &&
      typeof x.fee === "number" &&
      typeof x.wage === "number" &&
      typeof x.contractYears === "number" &&
      typeof x.amortYears === "number"
    );
  };
  if (!Array.isArray(o.signings) || !o.signings.every(txOk)) return null;
  if (!Array.isArray(o.sales) || !o.sales.every(txOk)) return null;
  return {
    v: WINDOW_STATE_VERSION,
    clubId: o.clubId,
    signings: o.signings.map((t) => ({ ...t, amortYears: clampAmortYears(t.amortYears) })),
    sales: o.sales,
  };
}
