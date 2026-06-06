"use client";

import { useCallback, useRef, useState } from "react";
import type {
  NarrativeRequest,
  NarrativeResponse,
} from "@/app/api/risk-narrative/route";

export type NarrativeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: NarrativeResponse }
  | { status: "error"; message: string };

export function useRiskNarrative() {
  const [state, setState] = useState<NarrativeState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (
      patient: NarrativeRequest["patient"],
      visit: NarrativeRequest["visit"],
      engineResult: NarrativeRequest["engineResult"]
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ status: "loading" });

      try {
        const res = await fetch("/api/risk-narrative", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient, visit, engineResult }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: "Unknown error" }))) as {
            error?: string;
            details?: string;
          };
          throw new Error(err.details || err.error || `HTTP ${res.status}`);
        }

        const data = (await res.json()) as NarrativeResponse;
        setState({ status: "ready", data });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const message = err instanceof Error ? err.message : "Failed to generate narrative";
        setState({ status: "error", message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  return { state, generate, reset };
}
