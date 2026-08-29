import { Session } from '@/types';
import React from 'react'
import PainNarrativeSummary from './PainNarrativeSummary';

const PatientCard = ({ data }:{ data: Session }) => {
    
    const { patientId, sessionId, processed, submittedAt } = data;

  return (
    <div className="bg-white border border-black/12 rounded-xl p-3.5">
          <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">Patient</div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[12px] font-medium text-[#3C3489] shrink-0">
              PT
            </div>
            <div>
              <div className="text-[14px] font-medium text-[#2C2C2A] mb-1 uppercase"> {patientId}</div>
              <div className="text-[12px] text-[#888780]">Session ID: {sessionId}</div>
            </div>
          </div>
          <hr className="border-none border-t border-black/10 my-3" />
          <div className="text-[10px] font-medium text-[#888780] uppercase tracking-[0.05em] mb-2">Pain zones recorded</div>
          <div className="flex flex-col gap-1.5 mb-2">
            {processed.regions.map((region) => {
                const { label, painType,intensity, color } = region;
                return(
              <div
                key={region.label}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg"
                style={{ background: "#F1EFE8" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <div>
                    <div className="text-[12px] font-medium text-[#2C2C2A]">{label}</div>
                    <div className="text-[11px] text-[#888780]">{painType}</div>
                  </div>
                </div>
                <div>
                  <div className="h-1 rounded-sm bg-black/10 w-[60px] overflow-hidden">
                    <div className="h-full rounded-sm" style={{ width: `${intensity*10}%`, background: color }} />
                  </div>
                  <div className="text-[11px] text-[#B4B2A9] text-right mt-[2px]">{intensity}/10</div>
                </div>
              </div>
                )
})}
          </div>
                  <PainNarrativeSummary
  patientId={data.patientId}
  regionDetails={data.processed.painSummary.regionDetails ?? []}
/>
          <hr className="border-none border-t border-black/10 my-3" />
          <div className="text-[11px] text-[#B4B2A9]">Submitted: {submittedAt ? new Date(submittedAt).toLocaleString() : 'N/A'}</div>
          {/* <div className="text-[11px] text-[#B4B2A9]">Submitted: 19 Apr 2026 · 14:32 UTC</div> */}
        </div>
  )
}

export default PatientCard