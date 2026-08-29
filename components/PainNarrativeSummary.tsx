// components/PainNarrativeSummary.tsx
import { RegionDetail } from "@/types";

function formatPattern(pattern: string): string {
  const map: Record<string, string> = {
    comes_and_goes: "comes and goes",
    worse_with_movement: "gets worse with movement",
    constant: "is constant",
    unspecified: "occurs with no clear pattern",
  };
  return map[pattern] ?? pattern.replace(/_/g, " ");
}

function formatDuration(duration: string): string {
  const map: Record<string, string> = {
    few_days: "a few days",
    weeks: "several weeks",
    months: "several months",
    years: "years",
    unspecified: "an unspecified duration",
  };
  return map[duration] ?? duration.replace(/_/g, " ");
}

function formatBodyPart(bodyPart: string): string {
  return bodyPart.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function NarrativeLine({ patientId, detail }: { patientId: string; detail: RegionDetail }) {
  const hasTriggers = detail.triggers.length > 0;
  const hasPattern = detail.pattern !== "unspecified";
  const hasDuration = detail.duration !== "unspecified";

  if (!hasPattern && !hasTriggers && !hasDuration) return null;

  const triggers = detail.triggers.map((t) => t.replace(/_/g, " ")).join(" and ");

  return (
    <div className="px-3 py-2 bg-[#F1EFE8] rounded-lg text-[12px] text-[#2C2C2A] leading-relaxed">
      <span className="font-medium">Patient {patientId}</span> has pain in the{" "}
      <span className="font-medium">{formatBodyPart(detail.bodyPart)}</span>
      {hasPattern && <> which <span className="text-[#854F0B]">{formatPattern(detail.pattern)}</span></>}
      {hasDuration && <>, lasting <span className="text-[#854F0B]">{formatDuration(detail.duration)}</span></>}
      {hasTriggers && <>, and happens when <span className="text-[#854F0B]">{triggers}</span></>}.
    </div>
  );
}

export default function PainNarrativeSummary({
  patientId,
  regionDetails,
}: {
  patientId: string;
  regionDetails: RegionDetail[];
}) {
  const filtered = regionDetails.filter(
    (d) => d.pattern !== "unspecified" || d.triggers.length > 0 || d.duration !== "unspecified"
  );

  if (filtered.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em]">
        Patient narrative
      </div>
      {filtered.map((detail) => (
        <NarrativeLine key={detail.bodyPart} patientId={patientId} detail={detail} />
      ))}
    </div>
  );
}