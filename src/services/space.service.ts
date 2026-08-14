import { apiFetch } from '@/lib/http';
import type {
   MyLocationResult,
   Space,
   SpaceWriteRequest,
} from '@/features/space-reservations/types';

export function getSpaces() {
   return apiFetch<{ spaces: Space[] }>('/spaces').then((res) => res.spaces);
}

export function updateMyLocation(spaceId: number | null) {
   return apiFetch<MyLocationResult>('/spaces/my-location', {
      method: 'PATCH',
      body: JSON.stringify({ spaceId }),
   });
}

// 공간 생성
export function createSpace(body: SpaceWriteRequest) {
   return apiFetch<Space>('/spaces', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export function deleteSpace(spaceId: number) {
   return apiFetch<void>(`/spaces/${spaceId}`, {
      method: 'DELETE',
   });
}
