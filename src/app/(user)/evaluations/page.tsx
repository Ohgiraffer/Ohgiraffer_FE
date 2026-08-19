import { Suspense } from 'react';
import { prefetchIfAuthed } from '@/lib/auth/serverPrefetch';
import { getServerEvaluationsData } from '@/features/evaluations/getServerEvaluationsData';
import EvaluationsPageClient from '@/features/evaluations/components/EvaluationsPageClient';

export default async function EvaluationsPage() {
   const initialData = await prefetchIfAuthed(getServerEvaluationsData);
   return (
      <Suspense>
         <EvaluationsPageClient initialData={initialData} />
      </Suspense>
   );
}
