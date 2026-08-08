import { Suspense } from 'react';
import TeamPageClient from '@/features/team/components/TeamPageClient';

export default function TeamPage() {
   return (
      <Suspense>
         <TeamPageClient />
      </Suspense>
   );
}
