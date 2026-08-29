'use client'
import { Exercise, Session } from '@/types';
import { Loader2 } from 'lucide-react';
import React, { useTransition } from 'react'
import { toast } from 'react-toastify';
import { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';


const ActionBtns = ({
  sessionId,
  data,
  isEditing,
  setIsEditing,
  editedPlan,
  setData
}: {
  sessionId: string;
  data: Session;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editedPlan: Exercise[];
  setData: Dispatch<SetStateAction<Session>>;
}) => {
  const [approvalPending, startApprovalTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const router = useRouter();

  const handleApprove = async () => {
    startApprovalTransition(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/approve`, {
          method: "PATCH",
        });
        if (!res.ok) throw new Error("Failed to approve");

        setData((prev: Session) => ({
          ...prev,
          status: "approved",
        }));
        toast.success("Session approved successfully!");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Failed to approve session.");
      }
    });
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/edit-plan`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exercisePlan: editedPlan }),
        });
        if (!res.ok) throw new Error("Failed to save");

        setData((prev: Session) => ({
    ...prev,
    plan: {
      ...prev.plan,
      final: editedPlan,
      edited: true,
    },
  }));

        toast.success("Exercise plan updated!");
        setIsEditing(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to save changes.");
      }
    });
  };

  const isApproved = data.status === "approved";

  return (
    <div className="flex gap-2 mt-[14px]">
      {isEditing ? (
        <>
          {/* Cancel */}
          <button
            onClick={() => setIsEditing(false)}
            disabled={savePending}
            className="flex-1 py-[10px] rounded-lg text-[13px] text-[#2C2C2A] border border-black/[0.15] hover:bg-[#D3D1C7] disabled:opacity-50 transition-colors"
            style={{ background: "#F1EFE8" }}
          >
            Cancel
          </button>

          {/* Save changes */}
          <button
            onClick={handleSave}
            disabled={savePending}
            className="flex-1 py-[10px] rounded-lg text-[13px] font-medium text-white bg-[#0F6E56] hover:bg-[#085041] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savePending ? (
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="size-4 animate-spin" />
                <span>Saving...</span>
              </div>
            ) : "Save changes"}
          </button>
        </>
      ) : (
        <>
          {/* Edit plan */}
          <button
            onClick={() => setIsEditing(true)}
            disabled={isApproved}
            className="flex-1 py-[10px] rounded-lg text-[13px] text-[#2C2C2A] border border-black/[0.15] cursor-pointer hover:bg-[#D3D1C7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: "#F1EFE8" }}
          >
            Edit plan
          </button>

          {/* Approve */}
          <button
            disabled={approvalPending || isApproved}
            onClick={handleApprove}
            className="flex-1 py-[10px] rounded-lg text-[13px] font-medium text-[#E1F5EE] bg-[#0F6E56] border-none cursor-pointer hover:bg-[#085041] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {approvalPending ? (
              <div className="flex items-center gap-2 justify-center">
                <Loader2 className="size-4 animate-spin" />
                <span>Approving...</span>
              </div>
            ) : isApproved ? "✓ Approved" : "Approve and send to patient"}
          </button>
        </>
      )}
    </div>
  );
};

export default ActionBtns;