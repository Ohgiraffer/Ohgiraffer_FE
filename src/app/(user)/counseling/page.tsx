import { getVerifiedRole } from '@/lib/auth/serverAuth';
import StaffCounselingView from '@/features/counseling/components/StaffCounselingView';
import StudentCounselingView from '@/features/counseling/components/StudentCounselingView';
import CounselingPageClient from '@/features/counseling/components/CounselingPageClient';

export default async function CounselingPage() {
   const auth = await getVerifiedRole();

   if (!auth) return <CounselingPageClient />;

   const isStaff = auth.role === 'INSTRUCTOR' || auth.role === 'MANAGER';

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? '상담 관리' : '상담 신청 및 이력 조회'}
         </h1>

         <div className="mt-5">{isStaff ? <StaffCounselingView /> : <StudentCounselingView />}</div>
      </div>
   );
}
