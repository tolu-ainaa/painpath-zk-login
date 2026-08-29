export type Exercise = {
  name: string;
  targetRegion: string;
  description: string;
  sets: number | string;
  reps: number | string;
  frequency: string;
};
export type AIAnalysis = {
  conditionMatch: string;
  confidence: number;
  reasoning: string;
  exercisePlan: Exercise[];
  redFlags: string[];
  referralRecommended: boolean;
};
export type ProcessedRegion = {
  label: string;
  painType: "sharp" | "ache" | "stiff";
  intensity: number;
  count?: number;
  color: string;
  svgX: number;
  svgY: number;
};
export type PainSummary = {
  regions: ProcessedZone[];
  summary: {
    dominantPainType: string;
    maxIntensity: number;
    averageIntensity: number;
  };
  regionDetails: RegionDetail[];
};
export type PainZone = {
  zoneId: string;
  bodyPart: string;
  uvX: number;
  uvY: number;
  worldPosition: {
    x: number;
    y: number;
    z: number;
  };
  painType: "sharp" | "ache" | "stiff";
  intensity: number;
  timestamp: string;
};
export type SessionSummary = {
  totalZones: number;
  dominantPainType: "sharp" | "ache" | "stiff";
  maxIntensity: number;
  averageIntensity: number;
  durationSeconds: number;
};
export type Plan = {
  ai: Exercise[] | null;
  final: Exercise[] | null;
  edited: boolean;
  approvedBy: string | null;
  approvedAt: any | null; // Firestore Timestamp
};
export type Audit = {
  createdAt: any;   // Firestore Timestamp
  updatedAt: any;   // Firestore Timestamp
};
export type Session = {
  sessionId: string;
  patientId: string;
  deviceType: string;

  submittedAt: any; // Firestore Timestamp

  status: "pending_review" | "approved";

  rawInput: {
    painZones: PainZone[];
    sessionSummary: SessionSummary | null;
  };

  processed: {
    regions: ProcessedRegion[];
    painSummary: PainSummary;
  };

  aiAnalysis: AIAnalysis | null;

  plan: Plan;

  audit: Audit;
};

// types/index.ts — add this
export type RegionDetail = {
  bodyPart: string;
  markerCount: number;
  pattern: string;
  duration: string;
  triggers: string[];
};