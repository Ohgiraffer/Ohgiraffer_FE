import { serverApiFetch } from '@/lib/auth/serverPrefetch';
import type { NoticeCategory, NoticeListItem } from '@/services/notice.service';

export interface ServerNoticesData {
   initialCategories: NoticeCategory[];
   initialNotices: NoticeListItem[];
}

// notice.service.ts의 getNoticeCategories()/getNotices()와 동일한 엔드포인트(둘 다 응답이
// 래핑 없이 배열 그대로 내려옴)
export async function getServerNoticesData(accessToken: string): Promise<ServerNoticesData> {
   const [initialCategories, initialNotices] = await Promise.all([
      serverApiFetch<NoticeCategory[]>('/notice-categories', accessToken),
      serverApiFetch<NoticeListItem[]>('/notices', accessToken),
   ]);
   return { initialCategories, initialNotices };
}
