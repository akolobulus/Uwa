import { NextRequest, NextResponse } from "next/server";
import { getCencoriClient } from "@/lib/cencori";

export const runtime = "nodejs";

export type ConditionKey = "PPH" | "Preeclamp" | "Preterm";

export interface ConditionResult {
  condition?: string;
  probability?: number;
  score_0_to_100?: number;
  flagged?: boolean;
  top_drivers?: string;
}

export interface RiskEngineResult {
  composite_score?: number;
  any_flagged?: boolean;
  priority?: string;
  priority_colour?: string;
  conditions?: Partial<Record<ConditionKey, ConditionResult>>;
  timestamp?: string;
  model_version?: string;
}

export interface PatientContext {
  name: string;
  age: number;
  week: number;
  ancWeek?: number;
  gravidity?: number;
  scd: string;
  hiv: string;
  malaria: string;
  iptpDoses: string;
  htn: string;
  multiple: string;
  state?: string;
}

export interface VisitContext {
  sbp: number;
  dbp: number;
  hr?: number;
  bs?: number;
  temp?: number;
  oedema?: string;
  protein?: string;
  notes?: string;
}

export interface NarrativeRequest {
  patient: PatientContext;
  visit: VisitContext;
  engineResult: RiskEngineResult;
}

export interface NarrativeResponse {
  summary: string;
  conditions: Record<ConditionKey, string>;
  actionPlan: string;
  generatedAt: string;
}

const conditionLabels: Record<ConditionKey, string> = {
  PPH: "Postpartum haemorrhage",
  Preeclamp: "Preeclampsia/eclampsia",
  Preterm: "Preterm labour",
};

function numberOrDefault(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getCondition(engineResult: RiskEngineResult, key: ConditionKey) {
  const condition = engineResult.conditions?.[key] ?? {};
  const composite = numberOrDefault(engineResult.composite_score, 0);

  return {
    condition: condition.condition || conditionLabels[key],
    probability: numberOrDefault(condition.probability, composite / 100),
    score: numberOrDefault(condition.score_0_to_100, composite),
    flagged: Boolean(condition.flagged ?? composite >= 25),
    drivers: condition.top_drivers || "No condition-specific SHAP driver narrative was returned.",
  };
}

function buildSystemPrompt() {
  return `You are a plain-English clinical explainer for Nurture Clinical Intelligence, a maternal health AI system used at Nigerian hospitals and primary health centres.

Your job is to translate AI risk scores into clear, plain-English explanations that any healthcare worker can understand — not just specialists. Think of it like explaining to a junior nurse or a patient's family member why the system flagged someone.

STRICT LANGUAGE RULES — follow these exactly:
- NEVER use medical terms alone without a plain-English explanation in brackets immediately after.
  - Write: "heavy bleeding after delivery (postpartum haemorrhage)" NOT just "postpartum haemorrhage"
  - Write: "dangerous high blood pressure in pregnancy (preeclampsia)" NOT just "preeclampsia"
  - Write: "early delivery before 37 weeks (preterm labour)" NOT just "preterm labour"
  - Write: "high blood pressure (hypertension)" NOT just "hypertension"
- Use "she" and "her" when referring to the patient.
- Write in complete, full sentences. No bullet points inside the condition explanations.
- Avoid raw technical terms: never write "SHAP values", "ML model", "feature importance", "composite score", "probability threshold". Translate everything into plain English.
  - "composite score of 72/100" becomes "a high overall risk score of 72 out of 100"
  - "SHAP driver" becomes "the main reason the system flagged this"

CRITICAL — FOR FLAGGED CONDITIONS:
You MUST explain the specific reasons WHY the system flagged this patient. Do not write generic text like "risk is elevated" or "the system detected risk." Instead:
- Quote the real numbers (e.g. "her blood pressure today was 148/95, which is above the safe limit of 140/90")
- Explain in plain English what those numbers mean (e.g. "this level of blood pressure can damage her kidneys and put the baby at risk")
- Connect her history factors to the risk (e.g. "combined with her previous history of high blood pressure, this reading is very concerning")
- Explain why Nigeria-specific factors matter if relevant (malaria, sickle cell, late ANC booking, IPTp doses, HIV)

Respond ONLY with valid JSON. No markdown, no preamble, no text outside the JSON object.`;
}

function buildUserPrompt(req: NarrativeRequest) {
  const { patient, visit, engineResult } = req;
  const gravidity = Number(patient.gravidity ?? 1);
  const lateBooking = (patient.ancWeek ?? 0) >= 20;
  const scdMap: Record<string, string> = {
    AA: "normal blood type (AA — no sickle cell)",
    AS: "sickle cell carrier (AS genotype — mild additional risk)",
    SC: "sickle cell disease variant (SC genotype — significant risk)",
    SS: "full sickle cell disease (SS genotype — high risk)",
  };
  const hivMap: Record<string, string> = {
    Negative: "HIV negative",
    Positive_ART: "HIV positive but on treatment (ART)",
    Positive_No_ART: "HIV positive with NO treatment — high risk",
    Unknown: "HIV status not confirmed — needs testing",
  };

  const conditionEntries = [
    { key: "PPH" as const, label: "Heavy Bleeding After Delivery (Postpartum Haemorrhage)", data: engineResult.conditions?.["PPH"] },
    { key: "Preeclamp" as const, label: "Dangerous High Blood Pressure in Pregnancy (Preeclampsia)", data: engineResult.conditions?.["Preeclamp"] },
    { key: "Preterm" as const, label: "Early Delivery Risk (Preterm Labour)", data: engineResult.conditions?.["Preterm"] },
  ];

  const flaggedList = conditionEntries
    .filter(c => c.data?.flagged)
    .map(c => `${c.label} — risk score ${c.data?.score_0_to_100}/100`)
    .join("; ") || "No conditions flagged";

  const driverBlocks = conditionEntries
    .map(c => {
      const status = c.data?.flagged ? "FLAGGED - NEEDS ACTION" : "NOT FLAGGED - ROUTINE";
      return `${c.label} [${status}]
  Risk score: ${c.data?.score_0_to_100}/100
  Probability: ${((c.data?.probability ?? 0) * 100).toFixed(1)}%
  Main reasons the system flagged this: ${c.data?.top_drivers || "No drivers recorded"}`;
    })
    .join("\n\n");

  return `Write a plain-English clinical risk explanation for the following pregnant patient. A doctor or nurse will read this to understand WHY the system flagged her and what to do next.

PATIENT INFORMATION:
Name: ${patient.name}
Age: ${patient.age} years old
State: ${patient.state || "Not recorded"}
How far along: ${patient.week} weeks pregnant
When she first came for antenatal care: Week ${patient.ancWeek ?? "Unknown"} ${lateBooking ? "(WARNING: this is LATE — safe booking is before week 20)" : "(good — came early)"}
Number of pregnancies: ${gravidity} ${gravidity >= 5 ? "(WARNING: 5 or more pregnancies raises the risk of heavy bleeding after delivery)" : ""}
Blood type / sickle cell: ${scdMap[patient.scd] ?? patient.scd}
HIV status: ${hivMap[patient.hiv] ?? patient.hiv}
Malaria episodes this pregnancy: ${patient.malaria} ${parseInt(patient.malaria) > 0 ? "(WARNING: malaria during pregnancy raises multiple risks)" : ""}
Anti-malaria prevention doses received (IPTp): ${patient.iptpDoses} ${parseInt(patient.iptpDoses) < 2 ? "(WARNING: fewer than 2 doses means she is not adequately protected)" : ""}
History of high blood pressure: ${patient.htn === "1" ? "YES — she has had high blood pressure before" : "No previous history"}
Carrying twins or more: ${patient.multiple === "1" ? "YES — multiple pregnancy raises all risks" : "No"}

WHAT THE DOCTOR MEASURED TODAY:
Blood pressure: ${visit.sbp}/${visit.dbp} mmHg ${visit.sbp >= 140 || visit.dbp >= 90 ? "(WARNING: HIGH — above the safe limit of 140/90)" : visit.sbp >= 130 ? "(BORDERLINE — approaching the safe limit)" : "(within normal range)"}
Heart rate: ${visit.hr ?? "Not recorded"} bpm
Blood sugar: ${visit.bs ?? "Not recorded"} mmol/L
Temperature: ${visit.temp ?? "Not recorded"} degrees C
Swelling (oedema): ${visit.oedema ?? "Not assessed"} ${visit.oedema === "severe" ? "(WARNING: severe swelling is a danger sign)" : ""}
Protein in urine: ${visit.protein ?? "Not assessed"} ${visit.protein === "positive" ? "(WARNING: protein in urine means the kidneys may be under stress)" : ""}

WHAT THE AI SYSTEM FOUND:
Overall risk score: ${numberOrDefault(engineResult.composite_score, 0)}/100 — ${engineResult.priority_colour || "Unknown"} risk tier
Any risks flagged: ${engineResult.any_flagged ? "YES — action required" : "No — routine monitoring"}
What was flagged: ${flaggedList}

DETAILED RISK BREAKDOWN:
${driverBlocks}

YOUR TASK:
Write the JSON narrative below. Rules for each flagged condition:
1. Start by clearly stating the system flagged this patient for [condition in plain English].
2. Quote the exact numbers that triggered the flag and explain what they mean.
3. Connect her personal history and background factors that make this worse.
4. Explain the real-world consequence if this is not treated (e.g. "if left untreated, this can cause seizures").
5. End with what the nurse should watch for at the next visit.

For conditions NOT flagged, write 2 reassuring sentences and mention one thing that would change the picture.

Return exactly this JSON (no markdown, no code fences, no text before or after the JSON):
{
  "summary": "4-5 sentences. Start with the patient name and how far along she is. State her overall risk level in plain English. Name what was flagged and the single biggest reason. Mention the most important compounding factor from her history. End with the urgency level for clinical action.",
  "conditions": {
    "PPH": "3-5 sentences in plain English about her risk of heavy bleeding after delivery (postpartum haemorrhage). If FLAGGED: exactly why — quote her specific numbers, explain her history, explain the real risk. If NOT FLAGGED: brief reassurance and what to monitor.",
    "Preeclamp": "3-5 sentences in plain English about her risk of dangerous high blood pressure in pregnancy (preeclampsia). If FLAGGED: exactly why — quote her blood pressure reading, protein/swelling if present, her hypertension history. If NOT FLAGGED: brief reassurance and what to watch.",
    "Preterm": "3-5 sentences in plain English about her risk of early delivery before 37 weeks (preterm labour). If FLAGGED: exactly why — the specific factors that drive this. If NOT FLAGGED: brief reassurance and what would change the picture."
  },
  "actionPlan": "6 numbered steps in priority order. Be specific: which test, which referral, which medication, which timing. Write as direct instructions to a nurse."
}`;
}

function extractJson(raw: string): string {
  // Remove markdown code fences
  let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // Find first and last brace
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  // If we found braces, extract only that JSON
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  // If no braces found, return as-is
  return cleaned;
}

function fallbackNarrative(req: NarrativeRequest, rawResponse?: string): NarrativeResponse {
  const pph = getCondition(req.engineResult, "PPH");
  const preeclamp = getCondition(req.engineResult, "Preeclamp");
  const preterm = getCondition(req.engineResult, "Preterm");

  // Only use rawResponse if it's clearly narrative text, not JSON
  let summaryText: string;
  if (rawResponse && !rawResponse.includes("{") && !rawResponse.includes("[")) {
    summaryText = rawResponse.substring(0, 500); // Limit length
  } else {
    // Generate a clean clinical summary from engine data
    const composite = numberOrDefault(req.engineResult.composite_score, 0);
    const flaggedList = [pph, preeclamp, preterm]
      .filter(c => c.flagged)
      .map(c => c.condition)
      .join(", ") || "no major conditions";
    
    // Safe patient name — fallback to generic ID if name is missing
    const patientName = req.patient.name && req.patient.name !== "undefined" 
      ? req.patient.name 
      : "Patient";
    
    const patientAge = Number.isFinite(req.patient.age) ? req.patient.age : "Unknown";
    const patientWeek = Number.isFinite(req.patient.week) ? req.patient.week : "Unknown";
    
    summaryText = `${patientName}, age ${patientAge}, is at week ${patientWeek} of pregnancy. ML risk assessment shows a composite score of ${composite}/100 with ${flaggedList} flagged. Clinical monitoring and specialist review are recommended.`;
  }

  return {
    summary: summaryText,
    conditions: {
      PPH: pph.drivers,
      Preeclamp: preeclamp.drivers,
      Preterm: preterm.drivers,
    },
    actionPlan:
      "1. Review vital signs and ML risk drivers with the attending clinician.\n2. Repeat assessments if clinically indicated.\n3. Escalate urgently if new symptoms or deterioration observed.",
    generatedAt: new Date().toISOString(),
  };
}

function normaliseNarrative(value: unknown, req: NarrativeRequest): NarrativeResponse {
  if (!value || typeof value !== "object") {
    return fallbackNarrative(req);
  }

  const candidate = value as Partial<NarrativeResponse>;

  return {
    summary: typeof candidate.summary === "string" ? candidate.summary : fallbackNarrative(req).summary,
    conditions: {
      PPH:
        typeof candidate.conditions?.PPH === "string"
          ? candidate.conditions.PPH
          : getCondition(req.engineResult, "PPH").drivers,
      Preeclamp:
        typeof candidate.conditions?.Preeclamp === "string"
          ? candidate.conditions.Preeclamp
          : getCondition(req.engineResult, "Preeclamp").drivers,
      Preterm:
        typeof candidate.conditions?.Preterm === "string"
          ? candidate.conditions.Preterm
          : getCondition(req.engineResult, "Preterm").drivers,
    },
    actionPlan:
      typeof candidate.actionPlan === "string" && candidate.actionPlan.trim()
        ? candidate.actionPlan
        : fallbackNarrative(req).actionPlan,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<NarrativeRequest>;

    if (!body.patient || !body.visit || !body.engineResult) {
      return NextResponse.json(
        { error: "patient, visit, and engineResult are required" },
        { status: 400 }
      );
    }

    const requestBody = body as NarrativeRequest;
    
    // Debug: Log what we received
    console.log("Narrative request received:");
    console.log("- Patient name:", requestBody.patient.name);
    console.log("- Patient age:", requestBody.patient.age);
    console.log("- Visit BP:", requestBody.visit.sbp, "/", requestBody.visit.dbp);
    
    const response = await getCencoriClient().ai.chat({
      model: process.env.CENCORI_RISK_MODEL || "groq/llama-3.3-70b-versatile",
      temperature: 0.15,
      maxTokens: 1400,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(requestBody) },
      ],
    });

    const raw = response.content?.trim() || "";

    // Try to extract and parse JSON
    const jsonStr = extractJson(raw);
    let parsed: NarrativeResponse;

    try {
      const jsonObj = JSON.parse(jsonStr);
      parsed = normaliseNarrative(jsonObj, requestBody);
    } catch (parseErr) {
      console.warn("JSON parse failed, using fallback");
      console.warn("Raw AI response:", raw.substring(0, 500)); // Log first 500 chars
      console.warn("Extracted JSON:", jsonStr.substring(0, 500)); // Log extracted JSON attempt
      console.warn("Parse error:", parseErr instanceof Error ? parseErr.message : "Unknown error");
      // Don't pass raw response to fallback — construct clean fallback instead
      parsed = fallbackNarrative(requestBody);
    }

    parsed.generatedAt = new Date().toISOString();
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Narrative generation failed";
    console.error("Cencori/Groq narrative generation error:", err);

    return NextResponse.json(
      { error: "Narrative generation failed", details: message },
      { status: 500 }
    );
  }
}
