import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { Space } from './types';

// space.service.ts의 getSpaces()와 동일한 엔드포인트·응답 언래핑
export async function getServerSpaces(accessToken: string): Promise<Space[]> {
   const { spaces } = await serverApiFetch<{ spaces: Space[] }>('/spaces', accessToken);
   return spaces;
}
