"use client";
import React, { useState } from "react";
import PatientCard from "./PatientCard";
import HeatCard from "./HeatCard";
import AiAssessment from "./AiAssessment";
import ActionBtns from "./ActionBtns";
import { Exercise, Session } from "@/types";

const PatientPageContainer = ({ result }: { result: Session }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  // const [editedPlan, setEditedPlan] = useState(data?.aiAnalysis?.exercisePlan ?? []);
  const [editedPlan, setEditedPlan] = useState<Exercise[]>(
    result.plan?.final ?? result.plan?.ai ?? [],
  );
  const [data, setData] = useState<Session>(result);
  

  return (
    <div className="min-h-screen text-[13px] text-[#2C2C2A]">

      {/* Main grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Patient card */}
        <PatientCard data={data} />


        {/* Heatmap card */}
        <HeatCard painZones={data.rawInput.painZones} />

        {/* AI Assessment — full width */}
        <AiAssessment
          aiAnalysis={data.aiAnalysis}
          plan={data.plan}
          isEditing={isEditing}
          editedPlan={editedPlan}
          setEditedPlan={setEditedPlan}
        />
      </div>
      <ActionBtns
        sessionId={data.sessionId}
        data={data}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editedPlan={editedPlan}
        setData={setData}
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  );
};

export default PatientPageContainer;
