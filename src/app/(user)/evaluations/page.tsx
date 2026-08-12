import { Suspense } from 'react';
import EvaluationsPageClient from '@/features/evaluations/components/EvaluationsPageClient';

export default function EvaluationsPage() {
   return (
      <Suspense>
         <EvaluationsPageClient />
      </Suspense>
   );
}
