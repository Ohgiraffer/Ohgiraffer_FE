import { getVerifiedRole } from '@/lib/auth/getVerifiedRole';
import ManagerTrackerBoard from '@/features/tracker/components/ManagerTrackerBoard';
import StudentTracker from '@/features/tracker/components/StudentTracker';
import TrackerPageClient from '@/features/tracker/components/TrackerPageClient';

// 미들웨어가 롤을 미리 검증해줬으면 여기서 바로 갈라 반대 롤의 번들을 아예 내려보내지 않는다.
// 검증 실패/타임아웃 등으로 못 받았을 때만 기존 클라이언트 분기(TrackerPageClient)로 폴백한다
export default async function AttendancePage() {
   const auth = await getVerifiedRole();

   if (auth) {
      return auth.role === 'STUDENT' ? <StudentTracker /> : <ManagerTrackerBoard />;
   }

   return <TrackerPageClient />;
}
