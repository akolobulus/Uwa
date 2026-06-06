"use client";

import { useEffect } from "react";
import { useRiskNarrative } from "@/hooks/useRiskNarrative";
import type {
  NarrativeRequest,
  RiskEngineResult,
} from "@/app/api/risk-narrative/route";

/**
 * Sanitize narrative text by removing any JSON-like formatting
 */
function sanitizeNarrative(text: string): string {
  if (!text) return "";
  
  // Remove any leading JSON object/array syntax
  let cleaned = text
    .replace(/^[\s\n]*[\{\[][\s\S]*?[\}\]][\s\n]*/m, "") // JSON objects/arrays at start
    .replace(/^[\s\n]*["']/, "") // Opening quotes
    .replace(/["'][\s\n]*$/, "") // Closing quotes
    .trim();

  // If still contains JSON-like patterns, do aggressive cleanup
  if (cleaned.includes("{") || cleaned.includes("[")) {
    cleaned = cleaned
      .replace(/[{}\[\]]/g, " ")
      .replace(/:\s*/g, ": ")
      .replace(/,\s*/g, ", ")
      .trim();
  }

  // Remove any remaining escaped quotes or newline escapes
  cleaned = cleaned
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function MaterialIcon({
  children,
  filled = false,
  className = "",
}: {
  children: string;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {children}
    </span>
  );
}

function NarrativeSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-3/4 rounded bg-on-surface/10" />
      <div className="h-4 w-full rounded bg-on-surface/10" />
      <div className="h-4 w-5/6 rounded bg-on-surface/10" />
      <div className="h-4 w-2/3 rounded bg-on-surface/10" />
    </div>
  );
}

function ConditionNarrative({
  label,
  narrative,
  flagged,
  accent,
}: {
  label: string;
  narrative: string;
  flagged: boolean;
  accent: "red" | "amber" | "blue";
}) {
  const accentMap = {
    red: {
      border: "border-l-red-500",
      badge: flagged ? "bg-red-600 text-white" : "bg-red-100 text-red-800",
      text: "text-red-900",
    },
    amber: {
      border: "border-l-amber-500",
      badge: flagged ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-900",
      text: "text-amber-900",
    },
    blue: {
      border: "border-l-blue-500",
      badge: flagged ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-900",
      text: "text-blue-900",
    },
  };
  const colors = accentMap[accent];

  return (
    <div className={`border-l-4 ${colors.border} bg-surface-container-low p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${colors.badge}`}>
          {flagged ? "Flagged" : "Clear"}
        </span>
        <span className={`text-xs font-bold uppercase ${colors.text}`}>{label}</span>
      </div>
      <p className="text-xs leading-relaxed text-on-surface">{narrative}</p>
    </div>
  );
}

function ActionPlan({ text }: { text: string }) {
  // Clean the input — remove any JSON-like formatting
  let cleaned = text
    .replace(/^[\s\n]*[\{\[][\s\S]*?[\}\]][\s\n]*/m, "") // Remove JSON objects/arrays at start
    .replace(/^[\s\n]*["'].*["'][\s\n]*/m, "") // Remove quoted strings at start
    .trim();

  // If still looks like JSON, extract just the text
  if (cleaned.includes("{") || cleaned.includes("[")) {
    cleaned = cleaned.replace(/[{}\[\]"']/g, "").trim();
  }

  // Parse numbered list
  const items = cleaned
    .split(/\n+/)
    .map((line) => line.replace(/^(?:\d+\.|-|\*|\s)*/, "").trim())
    .filter((line) => line.length > 0);

  return (
    <ol className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item.substring(0, 20)}-${index}`} className="flex items-start gap-3 text-xs text-on-surface">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-primary text-[10px] font-bold text-on-primary">
            {index + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

interface RiskNarrativePanelProps {
  patient: NarrativeRequest["patient"] & { id?: string };
  latestVisit: (NarrativeRequest["visit"] & { id?: string; scoredAt?: string | null }) | null;
  engineResult: RiskEngineResult | null;
}

export function RiskNarrativePanel({
  patient,
  latestVisit,
  engineResult,
}: RiskNarrativePanelProps) {
  const { state, generate, reset } = useRiskNarrative();
  
  // Ensure all required fields are present (safeguard against incomplete patient data)
  const completePatient = {
    name: patient.name || "Patient",
    age: patient.age || 0,
    week: patient.week || 0,
    ancWeek: patient.ancWeek,
    gravidity: patient.gravidity,
    scd: patient.scd || "AA",
    hiv: patient.hiv || "Negative",
    malaria: patient.malaria || "0",
    iptpDoses: patient.iptpDoses || "0",
    htn: patient.htn || "0",
    multiple: patient.multiple || "0",
    state: patient.state,
  };
  
  const narrativeKey =
    latestVisit && engineResult
      ? `${patient.id ?? patient.name}:${latestVisit.id ?? latestVisit.scoredAt ?? "visit"}:${latestVisit.scoredAt ?? engineResult.timestamp ?? engineResult.composite_score ?? "scored"}`
      : null;

  useEffect(() => {
    if (!latestVisit || !engineResult) {
      reset();
      return;
    }

    generate(completePatient, latestVisit, engineResult);
    // The key above intentionally controls when a scored visit needs a fresh narrative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrativeKey, generate, reset]);

  if (!latestVisit) {
    return (
      <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-6 text-center text-xs text-on-surface-variant">
        <MaterialIcon className="mb-2 block text-2xl">edit_note</MaterialIcon>
        Log the first ANC visit to generate a clinical narrative for this patient.
      </div>
    );
  }

  if (!engineResult) {
    return (
      <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-6 text-center text-xs text-on-surface-variant">
        <MaterialIcon className="mb-2 block text-2xl">science</MaterialIcon>
        ML scoring was unavailable for this visit, so the narrative cannot be generated yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-5 py-4">
        <div className="flex items-center gap-2">
          <MaterialIcon className="text-base text-primary" filled>
            psychology
          </MaterialIcon>
          <span className="text-xs font-bold uppercase text-primary">Nurture Clinical Intelligence</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          Groq Llama via Cencori
        </div>
      </div>

      <div className="space-y-5 p-5">
        {(state.status === "idle" || state.status === "loading") && (
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase text-on-surface-variant">
              Generating clinical narrative
            </div>
            <NarrativeSkeleton />
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <div className="mb-1 font-bold">Narrative generation failed</div>
            <div>{state.message}</div>
            <button
              onClick={() => generate(completePatient, latestVisit, engineResult)}
              className="mt-3 flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-red-700"
            >
              <MaterialIcon className="text-xs">refresh</MaterialIcon>
              Retry
            </button>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase text-on-surface-variant">
                Clinical Summary
              </div>
              <p className="text-sm leading-relaxed text-on-surface">{sanitizeNarrative(state.data.summary)}</p>
            </div>

            <div>
              <div className="mb-3 text-[10px] font-bold uppercase text-on-surface-variant">
                Condition Analysis
              </div>
              <div className="space-y-3">
                <ConditionNarrative
                  label="Postpartum Haemorrhage"
                  narrative={sanitizeNarrative(state.data.conditions.PPH)}
                  flagged={engineResult.conditions?.PPH?.flagged ?? false}
                  accent="red"
                />
                <ConditionNarrative
                  label="Preeclampsia / Eclampsia"
                  narrative={sanitizeNarrative(state.data.conditions.Preeclamp)}
                  flagged={engineResult.conditions?.Preeclamp?.flagged ?? false}
                  accent="amber"
                />
                <ConditionNarrative
                  label="Preterm Labour"
                  narrative={sanitizeNarrative(state.data.conditions.Preterm)}
                  flagged={engineResult.conditions?.Preterm?.flagged ?? false}
                  accent="blue"
                />
              </div>
            </div>

            <div>
              <div className="mb-3 text-[10px] font-bold uppercase text-on-surface-variant">
                Recommended Actions
              </div>
              <div className="bg-surface-container-low p-4">
                <ActionPlan text={state.data.actionPlan} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-on-surface-variant">
                Generated {new Date(state.data.generatedAt).toLocaleTimeString("en-NG")}
              </span>
              <button
                onClick={() => generate(completePatient, latestVisit, engineResult)}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
              >
                <MaterialIcon className="text-xs">refresh</MaterialIcon>
                Regenerate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
