import { Suspense } from 'react';
import { getVerifiedRole } from '@/lib/auth/getVerifiedRole';
import ManagerSubmissionsPageClient from '@/features/submissions/components/ManagerSubmissionsPageClient';
import StudentSubmissionsPageClient from '@/features/submissions/components/StudentSubmissionsPageClient';
import SubmissionsPageClient from '@/features/submissions/components/SubmissionsPageClient';

export default async function SubmissionsPage() {
   const auth = await getVerifiedRole();

   return (
      <Suspense>
         {auth ? (
            auth.role === 'STUDENT' ? (
               <StudentSubmissionsPageClient />
            ) : (
               <ManagerSubmissionsPageClient />
            )
         ) : (
            <SubmissionsPageClient />
         )}
      </Suspense>
   );
}
