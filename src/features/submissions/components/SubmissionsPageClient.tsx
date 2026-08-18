'use client';

import { useAuth } from '@/components/auth/AuthContext';
import ManagerSubmissionsPageClient from './ManagerSubmissionsPageClient';
import StudentSubmissionsPageClient from './StudentSubmissionsPageClient';

// 미들웨어의 서버 롤 검증이 안 됐을 때(page.tsx 참고)의 폴백 - 클라이언트에서 role이
// 확정될 때까지 기다렸다가 분기한다
export default function SubmissionsPageClient() {
   const { role } = useAuth();

   if (role === 'STUDENT') return <StudentSubmissionsPageClient />;
   return <ManagerSubmissionsPageClient />;
}
