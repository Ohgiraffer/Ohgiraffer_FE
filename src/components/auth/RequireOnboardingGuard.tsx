'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';

// AuthGuard와 동일한 이유로 isInitializing이 아니라 isSessionVerified를 기준으로 삼는다 -
// initialAuth로 bootcampId가 이미 채워져 있는데도 isInitializing만 보고 기다리면, AuthGuard는
// 통과했는데 바로 다음 단계인 여기서 또 빈 화면으로 막혀 깜빡임 제거 효과가 무의미해진다
export default function RequireOnboardingGuard({ children }: { children: React.ReactNode }) {
   const { bootcampId, isSessionVerified } = useAuth();
   const router = useRouter();

   const isOnboardingIncomplete = isSessionVerified && bootcampId === null;

   useEffect(() => {
      if (isOnboardingIncomplete) router.replace('/onboarding-wizard');
   }, [isOnboardingIncomplete, router]);

   if (!isSessionVerified || isOnboardingIncomplete) return null;

   return <>{children}</>;
}
