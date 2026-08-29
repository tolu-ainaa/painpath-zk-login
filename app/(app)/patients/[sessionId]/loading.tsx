export default function SessionLoading() {
  return (
    <div className="min-h-screen p-4" style={{ background: "#F1EFE8" }}>

      {/* Topbar skeleton */}
      <div className="flex items-center justify-between bg-white border border-black/[0.12] rounded-xl px-4 py-3 mb-[14px] animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-3 w-16 bg-[#E8E6DF] rounded-md" />
          <div className="w-px h-4 bg-black/10" />
          <div className="w-6 h-6 rounded-md bg-[#E8E6DF]" />
          <div className="h-3 w-20 bg-[#E8E6DF] rounded-md" />
          <div className="h-5 w-24 bg-[#E8E6DF] rounded-full" />
        </div>
        <div className="h-3 w-40 bg-[#E8E6DF] rounded-md" />
      </div>

      {/* Stat row skeleton */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg px-3 py-[10px] animate-pulse">
            <div className="h-6 w-8 bg-[#E8E6DF] rounded-md mb-2" />
            <div className="h-2 w-20 bg-[#E8E6DF] rounded-md" />
          </div>
        ))}
      </div>

      {/* Main grid skeleton */}
      <div className="grid grid-cols-2 gap-3">

        {/* Patient info card */}
        <div className="bg-white border border-black/[0.12] rounded-xl p-[14px] animate-pulse">
          <div className="h-2 w-12 bg-[#E8E6DF] rounded mb-3" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-[#E8E6DF]" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-24 bg-[#E8E6DF] rounded" />
              <div className="h-2 w-36 bg-[#E8E6DF] rounded" />
            </div>
          </div>
          <div className="border-t border-black/10 my-3" />
          <div className="h-2 w-28 bg-[#E8E6DF] rounded mb-3" />
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-[#F1EFE8] rounded-lg" />
            ))}
          </div>
        </div>

        {/* Heatmap card */}
        <div className="bg-white border border-black/[0.12] rounded-xl p-[14px] animate-pulse">
          <div className="h-2 w-20 bg-[#E8E6DF] rounded mb-3" />
          <div className="flex items-center justify-center h-[220px]">
            <div className="w-16 h-48 bg-[#E8E6DF] rounded-xl" />
          </div>
          <div className="flex gap-3 justify-center mt-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-3 w-12 bg-[#E8E6DF] rounded-full" />
            ))}
          </div>
        </div>

        {/* AI assessment card */}
        <div className="col-span-2 bg-white border border-black/[0.12] rounded-xl p-[14px] animate-pulse">
          <div className="h-2 w-24 bg-[#E8E6DF] rounded mb-3" />
          <div className="h-16 w-full bg-[#F5EED8] rounded-lg mb-4" />
          <div className="h-2 w-36 bg-[#E8E6DF] rounded mb-3" />
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 w-full bg-[#F1EFE8] rounded-lg" />
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 h-10 bg-[#E8E6DF] rounded-lg" />
            <div className="flex-1 h-10 bg-[#D3EDE5] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}