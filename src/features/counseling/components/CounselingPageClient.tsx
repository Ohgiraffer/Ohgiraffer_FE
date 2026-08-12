'use client';

import { useAuth } from '@/components/auth/AuthContext';
import StudentCounselingView from './StudentCounselingView';
import StaffCounselingView from './StaffCounselingView';

// 상담 관리 페이지 - 훈련생은 "상담 신청 및 이력 조회", 강사·매니저는 "상담 관리"로 타이틀부터 다르다
export default function CounselingPageClient() {
   const { role } = useAuth();
   const isStaff = role === 'INSTRUCTOR' || role === 'MANAGER';

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? '상담 관리' : '상담 신청 및 이력 조회'}
         </h1>

         <div className="mt-5">{isStaff ? <StaffCounselingView /> : <StudentCounselingView />}</div>
      </div>
   );
}
