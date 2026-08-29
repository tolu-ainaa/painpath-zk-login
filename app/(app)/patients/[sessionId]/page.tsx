import PatientPageContainer from "@/components/PatientPageContainer";
import StatRow from "@/components/StatRow";
import { getSession } from "@/lib/store/sessions";
import { notFound } from "next/navigation";

export default async function PatientsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const result = getSession(sessionId);

  if (!result) {
    notFound();
  }

  return (
    <>
      <StatRow />
      <PatientPageContainer result={result} />
    </>
  );
}
