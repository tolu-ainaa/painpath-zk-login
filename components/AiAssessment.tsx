
'use client'
import { AIAnalysis, Exercise, Plan } from '@/types';


function ExerciseEditCard({
  ex, index, onChange, onRemove,
}: {
  ex: Exercise;
  index: number;
  onChange: (index: number, field: keyof Exercise, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="border border-[#0F6E56]/20 bg-[#f7fdf9] rounded-lg px-3 py-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <input
          value={ex.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="Exercise name"
          className="flex-1 text-[13px] font-medium text-[#2C2C2A] bg-white border border-black/10 rounded-md px-2 py-[6px] outline-none focus:border-[#0F6E56] transition-colors"
        />
        <input
          value={ex.targetRegion}
          onChange={(e) => onChange(index, "targetRegion", e.target.value)}
          placeholder="Region"
          className="w-[130px] text-[11px] text-[#085041] bg-[#E1F5EE] border border-[#5DCAA5]/30 rounded-full px-2 py-[5px] outline-none focus:border-[#0F6E56] text-center transition-colors"
        />
        <button
          onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#888780] hover:text-[#A32D2D] hover:bg-[#FCEBEB] transition-colors shrink-0"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path d="M3 4h10M6 4V3h4v1M5 4l.5 8h5L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <textarea
        value={ex.description}
        onChange={(e) => onChange(index, "description", e.target.value)}
        placeholder="Exercise description"
        rows={2}
        className="text-[12px] text-[#888780] bg-white border border-black/10 rounded-md px-2 py-[6px] outline-none focus:border-[#0F6E56] resize-none leading-relaxed transition-colors"
      />

      <div className="grid grid-cols-3 gap-2">
        {(["sets", "reps", "frequency"] as const).map((field) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[#B4B2A9] uppercase tracking-[0.05em]">
              {field}
            </label>
            <input
              value={ex[field] as string}
              onChange={(e) => onChange(index, field, e.target.value)}
              placeholder={field === "frequency" ? "e.g. Twice daily" : field === "sets" ? "e.g. 3" : "e.g. 10"}
              className="text-[12px] text-[#2C2C2A] bg-white border border-black/10 rounded-md px-2 py-[5px] outline-none focus:border-[#0F6E56] transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  aiAnalysis: AIAnalysis | null;
  plan: Plan;
  isEditing: boolean;
  editedPlan: Exercise[];
  setEditedPlan: (plan: Exercise[]) => void;
};

const AiAssessment = ({
  aiAnalysis,
  isEditing,
  editedPlan,
  setEditedPlan,
  plan
}: Props) => {
  const { conditionMatch, confidence, reasoning } = aiAnalysis || {};

  function handleFieldChange(index: number, field: keyof Exercise, value: string) {
    const updated = editedPlan.map((ex, i) =>
      i === index ? { ...ex, [field]: value } : ex
    );
    setEditedPlan(updated);
  }

  function handleRemove(index: number) {
    setEditedPlan(editedPlan.filter((_, i) => i !== index));
  }

  function handleAdd() {
    setEditedPlan([
      ...editedPlan,
      { name: "", targetRegion: "", description: "", sets: "", reps: "", frequency: "" },
    ]);
  }

  // ── Null state ─────────────────────────────────────────────────────────────
  if (!aiAnalysis) {
    return (
      <div className="col-span-2 bg-white border border-black/[0.12] rounded-xl p-[14px]">
        <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">
          AI assessment
        </div>
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FCEBEB] flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
              <path d="M10 6v4m0 4h.01M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="#A32D2D" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-center">
            <div className="text-[13px] font-medium text-[#2C2C2A] mb-1">AI analysis unavailable</div>
            <div className="text-[12px] text-[#888780] max-w-xs leading-relaxed">
              The AI could not process this session. Review the pain zones manually and create a plan.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // const displayPlan = isEditing ? editedPlan : exercisePlan;
  const basePlan = plan?.final ?? plan?.ai ?? [];

const displayPlan = isEditing ? editedPlan : basePlan;

  return (
    <div className="col-span-2 bg-white border border-black/[0.12] rounded-xl p-[14px]">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em]">
          AI assessment
        </div>
        {isEditing && (
          <span className="text-[10px] font-medium px-2 py-[2px] rounded-full bg-[#EEEDFE] text-[#3C3489]">
            Editing mode
          </span>
        )}
      </div>

      {/* Condition box */}
      <div className="bg-[#FAEEDA] rounded-lg px-[14px] py-[10px] mb-3">
        <div className="text-[10px] font-medium text-[#633806] uppercase tracking-[0.05em] mb-[2px]">
          Condition match
        </div>
        <div className="text-[14px] font-medium text-[#412402]">{conditionMatch}</div>
        <div className="text-[12px] text-[#854F0B] mt-[2px]">
          {confidence}% confidence · {reasoning}
        </div>
      </div>

      {/* Exercises header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em]">
          Recommended exercises
        </div>
        {isEditing && (
          <span className="text-[11px] text-[#888780]">
            {editedPlan.length} exercise{editedPlan.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Exercise list */}
      <div className="flex flex-col gap-2">
        {isEditing ? (
          <>
            {editedPlan.map((ex, i) => (
              <ExerciseEditCard
                key={i}
                ex={ex}
                index={i}
                onChange={handleFieldChange}
                onRemove={handleRemove}
              />
            ))}
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 w-full py-[9px] rounded-lg border border-dashed border-black/20 text-[12px] text-[#888780] hover:border-[#0F6E56] hover:text-[#0F6E56] hover:bg-[#f7fdf9] transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add exercise
            </button>
          </>
        ) : (
          displayPlan?.map((ex: Exercise, i) => (
            <div key={`${ex.name}-${i}`} className="border border-black/10 rounded-lg px-3 py-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-[#2C2C2A]">{ex.name}</span>
                <span className="text-[10px] px-2 py-[2px] rounded-full bg-[#E1F5EE] text-[#085041]">
                  {ex.targetRegion}
                </span>
              </div>
              <div className="text-[12px] text-[#888780] leading-[1.5]">{ex.description}</div>
              <div className="flex gap-3 mt-[6px]">
                {[ex.sets, ex.reps, ex.frequency].map((m: string | number, i) => (
                  <span key={`${m}-${i}`} className="text-[11px] text-[#888780]">
                    {m === ex.sets
                      ? /\bsets?\b/i.test(m as string) ? m : `${m} sets`
                      : m === ex.reps
                      ? /\breps?\b/i.test(m as string) ? m : `${m} reps`
                      : m}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AiAssessment;