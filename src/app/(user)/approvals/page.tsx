import { Suspense } from 'react';
import ApprovalsPageClient from '@/features/approvals/components/ApprovalsPageClient';

export default function ApprovalsPage() {
   return (
      <Suspense>
         <ApprovalsPageClient />
      </Suspense>
   );
}
