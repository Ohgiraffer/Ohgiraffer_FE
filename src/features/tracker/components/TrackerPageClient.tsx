'use client';

import { useAuth } from '@/components/auth/AuthContext';
import ManagerTrackerBoard from './ManagerTrackerBoard';
import StudentTracker from './StudentTracker';

// "출결 관리"를 대체하는 페이지 - 영어 공통 이름은 tracker, 역할에 따라 화면이 갈린다
export default function TrackerPageClient() {
   const { role } = useAuth();

   if (role === 'STUDENT') return <StudentTracker />;
   return <ManagerTrackerBoard />;
}
