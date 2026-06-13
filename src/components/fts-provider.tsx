"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
  type Dispatch,
} from "react";
import { loadBundle, indexBundle, type BundleIndex, UnknownBundleVersionError } from "@/lib/bundle";
import {
  windowReducer,
  initialWindowState,
  type WindowState,
  type WindowAction,
} from "@/lib/window-state";
import { computeFinances, ruleForLeague, type FinanceSummary } from "@/lib/finance";
import { shareTransport } from "@/lib/share";
import type { BundleClub, BundlePlayer } from "@/lib/bundle-types";

interface FtsContextValue {
  index: BundleIndex;
  state: WindowState;
  dispatch: Dispatch<WindowAction>;
  club: BundleClub | null;
  squad: BundlePlayer[];
  finances: FinanceSummary | null;
}

const FtsContext = createContext<FtsContextValue | null>(null);

const STORAGE_KEY = "fts-window";

export function FtsProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<BundleIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(windowReducer, initialWindowState, (init) => {
    if (typeof window === "undefined") return init;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WindowState;
        if (parsed.v === init.v) return parsed;
      }
    } catch {
      // corrupted storage — start fresh
    }
    return init;
  });

  useEffect(() => {
    loadBundle()
      .then((b) => setIndex(indexBundle(b)))
      .catch((e) =>
        setError(
          e instanceof UnknownBundleVersionError
            ? e.message
            : "Could not load club data. Try refreshing.",
        ),
      );
  }, []);

  // a share link in the URL hash overrides local state
  useEffect(() => {
    shareTransport.decode(window.location).then((shared) => {
      if (shared) {
        dispatch({ type: "restore", state: shared });
        history.replaceState(null, "", window.location.pathname);
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<FtsContextValue | null>(() => {
    if (!index) return null;
    const club = state.clubId ? (index.clubById.get(state.clubId) ?? null) : null;
    const squad = club ? (index.playersByClub.get(club.id) ?? []) : [];
    const finances = club
      ? computeFinances(club, squad, state, ruleForLeague(club.leagueId))
      : null;
    return { index, state, dispatch, club, squad, finances };
  }, [index, state]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p role="alert" className="max-w-md text-center text-red-300">
          {error}
        </p>
      </div>
    );
  }

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="animate-pulse text-zinc-400">Loading club data…</p>
      </div>
    );
  }

  return <FtsContext.Provider value={value}>{children}</FtsContext.Provider>;
}

export function useFts(): FtsContextValue {
  const ctx = useContext(FtsContext);
  if (!ctx) throw new Error("useFts must be used inside FtsProvider");
  return ctx;
}
