const PatientCardSkeleton = () => (
  <div className="bg-white border border-black/[0.1] rounded-xl p-4 animate-pulse">
    {/* Top row */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#E8E6DF]" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-[#E8E6DF] rounded-md" />
          <div className="h-2 w-36 bg-[#E8E6DF] rounded-md" />
        </div>
      </div>
      <div className="h-5 w-24 bg-[#E8E6DF] rounded-full" />
    </div>

    {/* Pain zone pills */}
    <div className="flex gap-2 mb-3">
      <div className="h-5 w-28 bg-[#E8E6DF] rounded-full" />
      <div className="h-5 w-24 bg-[#E8E6DF] rounded-full" />
    </div>

    {/* AI box */}
    <div className="h-10 w-full bg-[#F5EED8] rounded-lg mb-3" />

    {/* Footer */}
    <div className="h-2 w-32 bg-[#E8E6DF] rounded-md" />
  </div>
);

export default function PatientsLoading() {
  return (
    <div className="min-h-screen p-4" style={{ background: "#F1EFE8" }}>

      {/* Topbar skeleton */}
      <div className="flex items-center justify-between bg-white border border-black/[0.12] rounded-xl px-4 py-3 mb-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#E8E6DF]" />
          <div className="h-3 w-20 bg-[#E8E6DF] rounded-md" />
          <div className="h-5 w-24 bg-[#E8E6DF] rounded-full" />
        </div>
        <div className="h-3 w-40 bg-[#E8E6DF] rounded-md" />
      </div>

      {/* Stat row skeleton */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg px-3 py-[10px] animate-pulse">
            <div className="h-6 w-8 bg-[#E8E6DF] rounded-md mb-2" />
            <div className="h-2 w-20 bg-[#E8E6DF] rounded-md" />
          </div>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 bg-white border border-black/[0.1] rounded-xl p-1 mb-4 w-fit animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 w-28 bg-[#E8E6DF] rounded-lg" />
        ))}
      </div>

      {/* Patient cards skeleton */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <PatientCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}