import { Suspense } from 'react';
import { getVerifiedRole } from '@/lib/auth/serverAuth';
import { prefetchIfAuthed } from '@/lib/auth/serverPrefetch';
import { getServerTeamBoardData } from '@/features/team/getServerTeamBoardData';
import ManagerTeamBoard from '@/features/team/components/ManagerTeamBoard';
import StudentTeamView from '@/features/team/components/StudentTeamView';
import TeamPageClient from '@/features/team/components/TeamPageClient';

export default async function TeamPage() {
   const auth = await getVerifiedRole();
   // accessToken이 없으면(검증 실패 등) 프리페치 없이 폴백 - 두 컴포넌트 다 prop 없이 렌더되면
   // 지금까지와 완전히 동일하게 클라이언트에서 직접 불러온다
   const boardData = auth ? await prefetchIfAuthed(getServerTeamBoardData) : undefined;

   return (
      <Suspense>
         {auth ? (
            auth.role === 'STUDENT' ? (
               <StudentTeamView {...boardData} />
            ) : (
               <ManagerTeamBoard {...boardData} />
            )
         ) : (
            <TeamPageClient />
         )}
      </Suspense>
   );
}
