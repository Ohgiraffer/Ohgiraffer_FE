import { Suspense } from 'react';
import { getVerifiedRole } from '@/lib/auth/getVerifiedRole';
import ManagerTeamBoard from '@/features/team/components/ManagerTeamBoard';
import StudentTeamView from '@/features/team/components/StudentTeamView';
import TeamPageClient from '@/features/team/components/TeamPageClient';

export default async function TeamPage() {
   const auth = await getVerifiedRole();

   return (
      <Suspense>
         {auth ? (
            auth.role === 'STUDENT' ? (
               <StudentTeamView />
            ) : (
               <ManagerTeamBoard />
            )
         ) : (
            <TeamPageClient />
         )}
      </Suspense>
   );
}
