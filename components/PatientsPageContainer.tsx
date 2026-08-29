"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Session } from "@/types";
import StatRow from "./StatRow";

// ── Helpers ────────────────────────────────────────────────────────────────
const PAIN_COLORS = { sharp: "#E24B4A", ache: "#EF9F27", stiff: "#378ADD" };
const TABS = ["Pending review", "Approved", "All patients"];
const PAGE_SIZE = 8; // patients per page

function timeAgo(isoString: number) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return `${hrs}h ago`;
  return `${days}d ago`;
}

function StatusPill({ status }: { status: Session["status"] }) {
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-[2px] rounded-full bg-[#FCEBEB] text-[#A32D2D]">
        <span className="w-[6px] h-[6px] rounded-full bg-[#E24B4A] inline-block" style={{ animation: "pulse 2s infinite" }} />
        Pending review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-[2px] rounded-full bg-[#E1F5EE] text-[#085041]">
      <span className="w-[6px] h-[6px] rounded-full bg-[#0F6E56] inline-block" />
      Approved
    </span>
  );
}

function PatientsCard({ patient }: { patient: Session }) {
  const isPending = patient.status === "pending_review";
  const regions   = patient.processed?.regions ?? [];
  const maxRegion = regions.reduce((a, b) => b.intensity > a.intensity ? b : a, regions[0]);

//   console.log(patient.sessionId);
  

  return (
    <Link
    //   onClick={onClick}
    href={`/patients/${patient.sessionId}`}
      className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 ${
        isPending ? "border-[#E24B4A]/20" : "border-black/[0.1]"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[12px] font-semibold text-[#3C3489] shrink-0">
            {patient.patientId.slice(-2)}
          </div>
          <div>
            <div className="text-[13px] font-medium text-[#2C2C2A]">{patient.patientId}</div>
            <div className="text-[11px] text-[#B4B2A9] mt-[1px]">
              {patient.sessionId.slice(0, 8)}… · {patient.deviceType}
            </div>
          </div>
        </div>
        <StatusPill status={patient.status} />
      </div>

      {/* Pain zones */}
      <div className="flex flex-wrap gap-[6px] mb-3">
        {regions.map((r) => (
          <span
            key={r.label}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-[3px] rounded-full border"
            style={{
              borderColor: `${PAIN_COLORS[r.painType]}40`,
              background: `${PAIN_COLORS[r.painType]}12`,
              color: PAIN_COLORS[r.painType],
            }}
          >
            <span
              className="w-[6px] h-[6px] rounded-full inline-block shrink-0"
              style={{ background: PAIN_COLORS[r.painType] }}
            />
            {r.label} · {r.intensity}/10
          </span>
        ))}
      </div>

      {/* AI match */}
      {patient.aiAnalysis && (
        <div className="bg-[#FAEEDA] rounded-lg px-3 py-2 mb-3">
          <div className="text-[11px] text-[#854F0B]">
            <span className="font-medium">{patient.aiAnalysis.conditionMatch}</span>
            <span className="text-[#B4874A] ml-2">{patient.aiAnalysis.confidence}% confidence</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#B4B2A9]">Submitted {timeAgo(patient.submittedAt._seconds * 1000)}</span>
        {isPending && (
          <span className="text-[11px] font-medium text-[#0F6E56] flex items-center gap-1">
            Review session →
          </span>
        )}
      </div>
    </Link>
  );
}

const PatientsPageContainer = ({ sessions }: { sessions: Session[] }) => {

  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function handleTabChange(i: number) {
    setActiveTab(i);
    setPage(1);
  }

  function handleSearchChange(q: string) {
    setSearch(q);
    setPage(1);
  }

  // 1. Sort all sessions newest first — once, before any filtering
const sorted = useMemo(() => {
  return [...sessions].sort((a, b) => {
    const getTime = (submittedAt: any) => {
      // Firestore Timestamp object: { _seconds, _nanoseconds }
      if (submittedAt?._seconds) return submittedAt._seconds;
      // Fallback: ISO string
      if (typeof submittedAt === "string") return new Date(submittedAt).getTime() / 1000;
      return 0;
    };

    return getTime(b.submittedAt) - getTime(a.submittedAt);
  });
}, [sessions]);
  

  // 2. Filter by tab
  const tabFiltered = useMemo(() => {
    if (activeTab === 0) return sorted.filter((s) => s.status === "pending_review");
    if (activeTab === 1) return sorted.filter((s) => s.status === "approved");
    return sorted;
  }, [sorted, activeTab]);

    // 3. Filter by search
  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((s) => s.patientId.toLowerCase().includes(q));
  }, [tabFiltered, search]);

  // 4. Paginate
  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / PAGE_SIZE));
  const displayed = searchFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pendingCount = sorted.filter((s) => s.status === "pending_review").length;

  // // 3. Filter by search (patientId — case insensitive)
  // const displayed = useMemo(() => {
  //   const q = search.trim().toLowerCase();
  //   if (!q) return tabFiltered;
  //   return tabFiltered.filter((s) => s.patientId.toLowerCase().includes(q));
  // }, [tabFiltered, search]);

  const pending  = sessions.filter((p) => p.status === "pending_review");
  const approved = sessions.filter((p) => p.status === "approved");
  const all      = sessions;

  const lists = [pending, approved, all];
  // const displayed = lists[activeTab];

  // const pendingCount = pending.length;
  const approvedCount = approved.length;
  
  return (
        <div className="min-h-screen py-4" style={{ background: "#F1EFE8" }}>

           {/* Search bar */}
      <div className="relative mb-4">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B4B2A9]"
        >
          <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          // onChange={(e) => setSearch(e.target.value)}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by patient ID…"
          className="w-full pl-8 pr-4 py-[10px] bg-white border border-black/[0.12] rounded-xl text-[13px] text-[#2C2C2A] placeholder:text-[#B4B2A9] outline-none focus:border-[#0F6E56] focus:ring-2 focus:ring-[#0F6E56]/10 transition-all"
        />
        {search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B4B2A9] hover:text-[#888780] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-black/[0.1] rounded-xl p-1 mb-4 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => handleTabChange(i)}
            className={`px-4 py-[7px] rounded-lg text-[12px] font-medium transition-all flex items-center gap-2 ${
              activeTab === i
                ? "bg-[#0F6E56] text-white shadow-sm"
                : "text-[#888780] hover:text-[#2C2C2A] hover:bg-[#F1EFE8]"
            }`}
          >
            {tab}
            {i === 0 && pendingCount > 0 && (
              <span
                className={`text-[10px] px-[6px] py-[1px] rounded-full font-semibold ${
                  activeTab === 0 ? "bg-white/20 text-white" : "bg-[#FCEBEB] text-[#A32D2D]"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] text-[#888780]">
          {search
            ? `${searchFiltered.length} result${searchFiltered.length !== 1 ? "s" : ""} for "${search}"`
            : `${searchFiltered.length} patient${searchFiltered.length !== 1 ? "s" : ""}`}
        </p>
        {totalPages > 1 && (
          <p className="text-[12px] text-[#888780]">
            Page {page} of {totalPages}
          </p>
        )}
      </div>

      {/* Patient list */}
      {displayed.length === 0 ? (
        <div className="bg-white border border-black/[0.1] rounded-xl p-10 text-center">
          <div className="text-[13px] text-[#888780]">{search ? `No patients match "${search}"` : "No patients in this category"}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {displayed.map((patient) => (
            <PatientsCard
              key={patient.sessionId}
              patient={patient}
            //   onClick={() => router.push(`/patients/${patient.sessionId}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">

          {/* Previous */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/[0.1] bg-white text-[#888780] hover:bg-[#F1EFE8] hover:text-[#2C2C2A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            // Always show first, last, current, and neighbours — collapse rest to "…"
            const show =
              p === 1 ||
              p === totalPages ||
              p === page ||
              p === page - 1 ||
              p === page + 1;

            const showEllipsisBefore = p === page - 1 && p > 2;
            const showEllipsisAfter  = p === page + 1 && p < totalPages - 1;

            if (!show) return null;

            return (
              <div key={p} className="flex items-center gap-1">
                {showEllipsisBefore && (
                  <span className="w-8 h-8 flex items-center justify-center text-[12px] text-[#B4B2A9]">…</span>
                )}
                <button
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
                    p === page
                      ? "bg-[#0F6E56] text-white"
                      : "border border-black/[0.1] bg-white text-[#888780] hover:bg-[#F1EFE8] hover:text-[#2C2C2A]"
                  }`}
                >
                  {p}
                </button>
                {showEllipsisAfter && (
                  <span className="w-8 h-8 flex items-center justify-center text-[12px] text-[#B4B2A9]">…</span>
                )}
              </div>
            );
          })}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-black/[0.1] bg-white text-[#888780] hover:bg-[#F1EFE8] hover:text-[#2C2C2A] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}


      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}

export default PatientsPageContainer