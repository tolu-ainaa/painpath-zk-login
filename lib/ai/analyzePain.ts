// import { AIAnalysis, PainSummary } from "@/types";
// import Anthropic from "@anthropic-ai/sdk";

// const client = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY!,
// });

// // ── Main function ───────────────────────────────────────────────────────────

// export async function analyzePain(payload: PainSummary): Promise<AIAnalysis> {
//   const prompt = buildPrompt(payload);

//   const response = await client.messages.create({
//     model: "claude-sonnet-4-20250514",
//     max_tokens: 1000,
//     temperature: 0.3, // lower = more deterministic / clinical
//     system: `You are a physiotherapy clinical decision support assistant.
// You receive structured pain assessment data from a patient's AR session and return a JSON analysis.
// You never diagnose — you suggest likely conditions and evidence-based exercises for a qualified physiotherapist to review.
// Always respond with valid JSON only. No preamble, no markdown, no explanation outside the JSON.`,
//     messages: [{ role: "user", content: prompt }],
//   });

//   const text = response.content
//     .filter((block) => block.type === "text")
//     .map((block) => (block as { type: "text"; text: string }).text)
//     .join("");

//   return parseAIResponse(text);
// }

// // ── Prompt builder (unchanged) ───────────────────────────────────────────────

// function buildPrompt(payload: PainSummary): string {
//   const regionLines = payload.regions
//     .map((r) => `- ${r.label}: ${r.painType} pain, intensity ${r.intensity}/10`)
//     .join("\n");

//   return `
// A patient has completed an AR pain mapping session. Here is their structured pain data:

// PAIN REGIONS:
// ${regionLines}

// SUMMARY:
// - Dominant pain type: ${payload.summary.dominantPainType}
// - Maximum intensity: ${payload.summary.maxIntensity}/10

// Please analyse this and return a JSON object with EXACTLY this structure:
// {
//   "conditionMatch": "string — most likely condition e.g. Lumbar strain L4/L5",
//   "confidence": number between 0 and 100,
//   "reasoning": "string — 1-2 sentence clinical reasoning for the condition match",
//   "exercisePlan": [
//     {
//       "name": "exercise name",
//       "targetRegion": "body region this targets",
//       "description": "clear patient-friendly instruction",
//       "sets": number,
//       "reps": number,
//       "frequency": "e.g. Twice daily"
//     }
//   ],
//   "redFlags": ["array of strings — any red flag symptoms to watch for"],
//   "referralRecommended": boolean
// }

// Return 3-5 exercises appropriate for the condition. Return JSON only.
// `.trim();
// }

// // ── Parser (unchanged) ───────────────────────────────────────────────────────

// function parseAIResponse(text: string): AIAnalysis {
//   try {
//     const clean = text.replace(/```json|```/g, "").trim();
//     return JSON.parse(clean);
//   } catch {
//     throw new Error(`Failed to parse Claude response: ${text}`);
//   }
// }

import { AIAnalysis, PainSummary } from "@/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Main function ───────────────────────────────────────────────────────────

export async function analyzePain(payload: PainSummary): Promise<AIAnalysis> {
  const model = client.getGenerativeModel({
    model: "gemini-3.5-flash",
    systemInstruction: `You are a physiotherapy clinical decision support assistant.
You receive structured pain assessment data from a patient's AR session and return a JSON analysis.
You never diagnose — you suggest likely conditions and evidence-based exercises for a qualified physiotherapist to review.
Always respond with valid JSON only. No preamble, no markdown, no explanation outside the JSON.`,

    generationConfig: {
      responseMimeType: "application/json",  // 👈 Gemini-specific — forces pure JSON output
      maxOutputTokens: 10000,                 // Increase token limit for more detailed responses (from 1000 to 2000) for 3.5-flash
      temperature: 0.3,                      // lower = more deterministic / clinical
    },
  });

  const prompt = buildPrompt(payload);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return parseAIResponse(text);
}

// ── Prompt builder (identical logic to Claude version) ──────────────────────

// function buildPrompt(payload: PainSummary): string {
//   const regionLines = payload.regions
//     .map((r) => `- ${r.label}: ${r.painType} pain, intensity ${r.intensity}/10`)
//     .join("\n");

//   return `
// A patient has completed an AR pain mapping session. Here is their structured pain data:

// PAIN REGIONS:
// ${regionLines}

// SUMMARY:
// - Dominant pain type: ${payload.summary.dominantPainType}
// - Maximum intensity: ${payload.summary.maxIntensity}/10

// Please analyse this and return a JSON object with EXACTLY this structure:
// {
//   "conditionMatch": "string — most likely condition e.g. Lumbar strain L4/L5",
//   "confidence": number between 0 and 100,
//   "reasoning": "string — 1-2 sentence clinical reasoning for the condition match",
//   "exercisePlan": [
//     {
//       "name": "exercise name",
//       "targetRegion": "body region this targets",
//       "description": "clear patient-friendly instruction",
//       "sets": number,
//       "reps": number,
//       "frequency": "e.g. Twice daily"
//     }
//   ],
//   "redFlags": ["array of strings — any red flag symptoms to watch for"],
//   "referralRecommended": boolean
// }

// Return 3-5 exercises appropriate for the condition. Return JSON only.
// `.trim();
// }

// lib/ai/analyzePain.ts — update buildPrompt only

function buildPrompt(payload: PainSummary): string {
  const regionLines = payload.regions
    .map((r) => `- ${r.label}: ${r.painType} pain, intensity ${r.intensity}/10`)
    .join("\n");

  // Build the region detail lines — skip unspecified entries
  const detailLines = payload.regionDetails
    .map((d) => {
      const triggers = d.triggers.length > 0 ? d.triggers.join(", ") : "none reported";
      const pattern = d.pattern !== "unspecified" ? d.pattern.replace(/_/g, " ") : "unspecified";
      const duration = d.duration !== "unspecified" ? d.duration.replace(/_/g, " ") : "unspecified";
      return `- ${formatBodyPart(d.bodyPart)}: pattern = ${pattern}, duration = ${duration}, triggers = ${triggers}`;
    })
    .join("\n");

  return `
A patient has completed an AR pain mapping session. Here is their structured pain data:

PAIN REGIONS:
${regionLines}

REGION DETAILS (pattern, duration, triggers per body part):
${detailLines || "No additional details provided."}

SUMMARY:
- Dominant pain type: ${payload.summary.dominantPainType}
- Maximum intensity: ${payload.summary.maxIntensity}/10
- Average intensity: ${payload.summary.averageIntensity}/10

Please analyse this and return a JSON object with EXACTLY this structure:
{
  "conditionMatch": "string — most likely condition e.g. Lumbar strain L4/L5",
  "confidence": number between 0 and 100,
  "reasoning": "string — 1-2 sentence clinical reasoning for the condition match",
  "exercisePlan": [
    {
      "name": "exercise name",
      "targetRegion": "body region this targets",
      "description": "clear patient-friendly instruction",
      "sets": number,
      "reps": number,
      "frequency": "e.g. Twice daily"
    }
  ],
  "redFlags": ["array of strings — any red flag symptoms to watch for"],
  "referralRecommended": boolean
}

Return 3-5 exercises appropriate for the condition. Return JSON only.
`.trim();
}

// helper used inside buildPrompt
function formatBodyPart(bodyPart: string): string {
  return bodyPart.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ── Parser ──────────────────────────────────────────────────────────────────

// function parseAIResponse(text: string): AIAnalysis {
//   try {
//     const clean = text.replace(/```json|```/g, "").trim();
//     return JSON.parse(clean);
//   } catch {
//     throw new Error(`Failed to parse Gemini response: ${text}`);
//   }
// }

function parseAIResponse(text: string): AIAnalysis {
  const clean = text.replace(/```json|```/g, "").trim();

  // Detect truncation early — valid JSON always ends with }
  if (!clean.endsWith("}")) {
    console.error(`Response appears truncated (${text.length} chars). Last 100 chars:`, text.slice(-100));
    throw new Error(`Gemini response was truncated at ${text.length} characters`);
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("Failed to parse. Response preview:", text.slice(0, 300));
    throw new Error(`Failed to parse Gemini response: ${text}`);
  }
}