import { apiFetch } from '@/lib/http';
import type {
   MyLocationResult,
   Space,
   SpaceWriteRequest,
} from '@/features/space-reservations/types';

export function getSpaces() {
   return apiFetch<{ spaces: Space[] }>('/spaces').then((res) => res.spaces);
}

// spaceId: 입실·이동할 공간 ID, 위치 해제 시 null.
// 빈 객체({})를 보내면 백엔드가 spaceId=null로 잘못 역직렬화할 수 있어 항상 필드를 명시해서 보낸다.
export function updateMyLocation(spaceId: number | null) {
   return apiFetch<MyLocationResult>('/spaces/my-location', {
      method: 'PATCH',
      body: JSON.stringify({ spaceId }),
   });
}

// 강사·매니저 전용 - 공간명 중복(409 SPACE_002)·입력값 검증 실패(400)는 프론트에서 필드별로 안내한다
export function createSpace(body: SpaceWriteRequest) {
   return apiFetch<Space>('/spaces', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

// 재실 인원이 있으면 409(SPACE_003)로 거절됨. 204 No Content는 apiFetch가 undefined로 처리해준다
export function deleteSpace(spaceId: number) {
   return apiFetch<void>(`/spaces/${spaceId}`, {
      method: 'DELETE',
   });
}
