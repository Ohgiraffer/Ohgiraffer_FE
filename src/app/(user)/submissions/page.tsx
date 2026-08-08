import { Suspense } from 'react';
import SubmissionsPageClient from '@/features/submissions/components/SubmissionsPageClient';

export default function SubmissionsPage() {
   return (
      <Suspense>
         <SubmissionsPageClient />
      </Suspense>
   );
}
