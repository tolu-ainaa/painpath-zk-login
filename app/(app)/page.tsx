import PatientsPageContainer from '@/components/PatientsPageContainer';
import StatRow from '@/components/StatRow';
import { fetchSessions } from '@/lib/api/session';

const page = async () => {

  const sessions = await fetchSessions();

  return (
    <>
    <StatRow />
<PatientsPageContainer sessions={sessions}/>
    </>
  );
}

export default page