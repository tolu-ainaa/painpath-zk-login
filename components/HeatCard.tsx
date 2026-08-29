// components/HeatCard.tsx
import { processPainZones, PAIN_COLORS } from "@/lib/mapToRegion";
import { PainZone } from "@/types";

function BodyHeatmap({ painZones }: { painZones: PainZone[] }) {
  const processed = processPainZones(painZones);

  return (
    <div className="flex items-center justify-center h-55">
      <svg viewBox="0 0 80 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-50">
        {/* Static body */}
        <ellipse cx="40" cy="14" rx="12" ry="13" fill="#D3D1C7" />
        <rect x="22" y="26" width="36" height="55" rx="6" fill="#D3D1C7" />
        <rect x="6"  y="28" width="16" height="42" rx="6" fill="#D3D1C7" />
        <rect x="58" y="28" width="16" height="42" rx="6" fill="#D3D1C7" />
        <rect x="24" y="80"  width="14" height="60" rx="6" fill="#D3D1C7" />
        <rect x="42" y="80"  width="14" height="60" rx="6" fill="#D3D1C7" />
        <rect x="24" y="138" width="14" height="42" rx="6" fill="#D3D1C7" />
        <rect x="42" y="138" width="14" height="42" rx="6" fill="#D3D1C7" />

        {/* Dynamic pain blobs */}
        {processed.map((zone) => {
          const r = 4 + (zone.intensity / 10) * 7;
          const opacity = 0.5 + (zone.intensity / 10) * 0.4;
          return (
            <ellipse
              key={zone.label}
              cx={zone.svgX}
              cy={zone.svgY}
              rx={r}
              ry={r * 0.8}
              fill={zone.color}
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
}

const HeatCard = ({ painZones = [] }: { painZones: PainZone[] }) => {
  return (
    <div className="bg-white border border-black/[0.12] rounded-xl p-[14px]">
      <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">
        Pain heatmap
      </div>

      <BodyHeatmap painZones={painZones} />

      <div className="flex gap-[10px] justify-center flex-wrap mt-2">
        {Object.entries(PAIN_COLORS).map(([label, color]) => (
          <span key={label} className="text-[11px] text-[#888780] flex items-center gap-1 capitalize">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};


// function BodyHeatmap() {
//   return (
//     <div className="flex items-center justify-center h-55">
//       <svg viewBox="0 0 80 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-50">
//         <ellipse cx="40" cy="14" rx="12" ry="13" fill="#D3D1C7" />
//         <rect x="22" y="26" width="36" height="55" rx="6" fill="#D3D1C7" />
//         <rect x="6" y="28" width="16" height="42" rx="6" fill="#D3D1C7" />
//         <rect x="58" y="28" width="16" height="42" rx="6" fill="#D3D1C7" />
//         <rect x="24" y="80" width="14" height="60" rx="6" fill="#D3D1C7" />
//         <rect x="42" y="80" width="14" height="60" rx="6" fill="#D3D1C7" />
//         <rect x="24" y="138" width="14" height="42" rx="6" fill="#D3D1C7" />
//         <rect x="42" y="138" width="14" height="42" rx="6" fill="#D3D1C7" />
//         <ellipse cx="40" cy="72" rx="10" ry="8" fill="#E24B4A" opacity="0.7" />
//         <ellipse cx="14" cy="38" rx="7" ry="6" fill="#EF9F27" opacity="0.6" />
//         <ellipse cx="49" cy="148" rx="6" ry="5" fill="#378ADD" opacity="0.5" />
//       </svg>
//     </div>
//   );
// }

// const HeatCard = () => {
//   return (
//     <div className="bg-white border border-black/[0.12] rounded-xl p-[14px]">
//           <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">Pain heatmap</div>
//           <BodyHeatmap />
//           <div className="flex gap-[10px] justify-center flex-wrap mt-2">
//             {[
//               { color: "#E24B4A", label: "Sharp" },
//               { color: "#EF9F27", label: "Ache" },
//               { color: "#378ADD", label: "Stiff" },
//             ].map((l) => (
//               <span key={l.label} className="text-[11px] text-[#888780] flex items-center gap-1">
//                 <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }} />
//                 {l.label}
//               </span>
//             ))}
//           </div>
//         </div>
//   )
// }

export default HeatCard