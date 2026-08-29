import PatientPageContainer from "@/components/PatientPageContainer";
import StatRow from "@/components/StatRow";

export default  async function PatientsPage({params}: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
  
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sessions/${sessionId}`,
    { cache: "no-store" }
  );

  const result = await res.json();

//   console.log(data);
  

  return (
    <>
    <StatRow />
    <PatientPageContainer result={result} />
    </>
  );
}
