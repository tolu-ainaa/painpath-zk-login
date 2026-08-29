import { PainZone, RegionDetail } from "@/types";
import { ProcessedZone } from "@/lib/mapToRegion";

export function buildPainSummary(
  regions: ProcessedZone[],
  sessionSummary: { dominantPainType: string; maxIntensity: number; averageIntensity: number },
  regionDetails: RegionDetail[]
) {
  return {
    regions: regions.map(({ label, painType, intensity }) => ({
      label,
      painType,
      intensity,
    })),
    summary: {
      dominantPainType: sessionSummary.dominantPainType,
      maxIntensity: sessionSummary.maxIntensity,
      averageIntensity: sessionSummary.averageIntensity,
    },
    regionDetails,
  };
}