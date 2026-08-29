// lib/store/sessions.ts
//
// In-memory session store, seeded from data/sessions.seed.json.
//
// This replaced Firestore when the portal was rebuilt for the Midnight
// hackathon. Nothing is written to disk and no external database is
// configured, so "everything the server stores" is exactly this process's
// heap — which is the point of the verifier panel in the demo. Mutations
// (approve, edit plan) live until the server restarts.

import seed from "@/data/sessions.seed.json";
import { processPainZones } from "@/lib/mapToRegion";
import type {
  AIAnalysis,
  Exercise,
  PainZone,
  ProcessedRegion,
  RegionDetail,
  Session,
  SessionSummary,
} from "@/types";

type SeedSession = {
  sessionId: string;
  patientId: string;
  deviceType: string;
  submittedAt: string;
  status: Session["status"];
  sessionSummary: SessionSummary;
  painZones: PainZone[];
  regionDetails: RegionDetail[];
  aiAnalysis: AIAnalysis | null;
  plan?: {
    edited?: boolean;
    approvedBy?: string | null;
    approvedAt?: string | null;
    final?: Exercise[] | null;
  };
};

function hydrate(entry: SeedSession): Session {
  const regions = processPainZones(entry.painZones) as ProcessedRegion[];

  return {
    sessionId: entry.sessionId,
    patientId: entry.patientId,
    deviceType: entry.deviceType,
    submittedAt: entry.submittedAt,
    status: entry.status,

    rawInput: {
      painZones: entry.painZones,
      sessionSummary: entry.sessionSummary,
    },

    processed: {
      regions,
      painSummary: {
        regions: regions.map(({ label, painType, intensity }) => ({
          label,
          painType,
          intensity,
        })),
        summary: {
          dominantPainType: entry.sessionSummary.dominantPainType,
          maxIntensity: entry.sessionSummary.maxIntensity,
          averageIntensity: entry.sessionSummary.averageIntensity,
        },
        regionDetails: entry.regionDetails ?? [],
      },
    },

    aiAnalysis: entry.aiAnalysis,

    plan: {
      ai: entry.aiAnalysis?.exercisePlan ?? null,
      final: entry.plan?.final ?? null,
      edited: entry.plan?.edited ?? false,
      approvedBy: entry.plan?.approvedBy ?? null,
      approvedAt: entry.plan?.approvedAt ?? null,
    },

    audit: {
      createdAt: entry.submittedAt,
      updatedAt: entry.plan?.approvedAt ?? entry.submittedAt,
    },
  };
}

// Survives dev-server module reloads so edits made in the UI do not vanish
// on every hot update.
const globalForSessions = globalThis as unknown as {
  __painPathSessions?: Map<string, Session>;
};

function store(): Map<string, Session> {
  if (!globalForSessions.__painPathSessions) {
    globalForSessions.__painPathSessions = new Map(
      (seed as SeedSession[]).map((entry) => [entry.sessionId, hydrate(entry)]),
    );
  }
  return globalForSessions.__painPathSessions;
}

export function listSessions(): Session[] {
  return [...store().values()];
}

export function getSession(sessionId: string): Session | undefined {
  return store().get(sessionId);
}

export function approveSession(sessionId: string): Session | undefined {
  const session = store().get(sessionId);
  if (!session) return undefined;

  const finalPlan = session.plan.edited ? session.plan.final : session.plan.ai;
  const now = new Date().toISOString();

  const updated: Session = {
    ...session,
    status: "approved",
    plan: {
      ...session.plan,
      final: finalPlan,
      approvedBy: "physio_001",
      approvedAt: now,
    },
    audit: { ...session.audit, updatedAt: now },
  };

  store().set(sessionId, updated);
  return updated;
}

export function editPlan(
  sessionId: string,
  exercisePlan: Exercise[],
): Session | undefined {
  const session = store().get(sessionId);
  if (!session) return undefined;

  const updated: Session = {
    ...session,
    plan: { ...session.plan, final: exercisePlan, edited: true },
    audit: { ...session.audit, updatedAt: new Date().toISOString() },
  };

  store().set(sessionId, updated);
  return updated;
}
