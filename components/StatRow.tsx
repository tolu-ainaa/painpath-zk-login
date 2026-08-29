import { fetchSessions } from "@/lib/api/session";


const StatRow = async() => {

    const sessions = await fetchSessions();

      const pending  = sessions.filter((p) => p.status === "pending_review");
  const approved = sessions.filter((p) => p.status === "approved");
  const all      = sessions;
  
  return (
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { val: pending.length, label: "Pending review", highlight: pending.length > 0 },
          { val: approved.length, label: "Approved" },
          { val: all.length, label: "Active patients" },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-lg px-3 py-[10px] ${s.highlight ? "bg-[#FCEBEB]" : "bg-white"}`}
          >
            <div className={`text-[20px] font-medium ${s.highlight ? "text-[#A32D2D]" : "text-[#2C2C2A]"}`}>
              {s.val}
            </div>
            <div className="text-[11px] text-[#888780] mt-[2px]">{s.label}</div>
          </div>
        ))}
      </div>
  )
}

export default StatRow