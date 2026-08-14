'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';

export default function RequireOnboardingGuard({ children }: { children: React.ReactNode }) {
   const { bootcampId, isInitializing } = useAuth();
   const router = useRouter();

   const isOnboardingIncomplete = !isInitializing && bootcampId === null;

   useEffect(() => {
      if (isOnboardingIncomplete) router.replace('/onboarding-wizard');
   }, [isOnboardingIncomplete, router]);

   if (isInitializing || isOnboardingIncomplete) return null;

   return <>{children}</>;
}
