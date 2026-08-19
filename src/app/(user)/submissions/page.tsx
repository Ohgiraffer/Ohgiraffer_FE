import { Suspense } from 'react';
import { getVerifiedRole } from '@/lib/auth/serverAuth';
import { prefetchIfAuthed } from '@/lib/auth/serverPrefetch';
import { getServerSubmissionsData } from '@/features/submissions/getServerSubmissionsData';
import ManagerSubmissionsPageClient from '@/features/submissions/components/ManagerSubmissionsPageClient';
import StudentSubmissionsPageClient from '@/features/submissions/components/StudentSubmissionsPageClient';
import SubmissionsPageClient from '@/features/submissions/components/SubmissionsPageClient';

export default async function SubmissionsPage() {
   const auth = await getVerifiedRole();
   const initialData = auth ? await prefetchIfAuthed(getServerSubmissionsData) : undefined;

   return (
      <Suspense>
         {auth ? (
            auth.role === 'STUDENT' ? (
               <StudentSubmissionsPageClient initialData={initialData} />
            ) : (
               <ManagerSubmissionsPageClient initialData={initialData} />
            )
         ) : (
            <SubmissionsPageClient />
         )}
      </Suspense>
   );
}
