import { prefetchIfAuthed } from '@/lib/auth/serverPrefetch';
import { getServerSpaces } from '@/features/space-reservations/getServerSpaces';
import SpaceReservationClient from '@/features/space-reservations/components/SpaceReservationClient';

// 이 페이지는 "공간 관리" 버튼 노출 말고는 롤 분기가 없어서 getVerifiedRole()은 필요 없다
export default async function SpaceReservationsPage() {
   const initialSpaces = await prefetchIfAuthed(getServerSpaces);
   return <SpaceReservationClient initialSpaces={initialSpaces} />;
}
