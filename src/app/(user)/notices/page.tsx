import { prefetchIfAuthed } from '@/lib/auth/serverPrefetch';
import { getServerNoticesData } from '@/features/notices/getServerNoticesData';
import NoticesPageClient from '@/features/notices/components/NoticesPageClient';

export default async function NoticesPage() {
   const data = await prefetchIfAuthed(getServerNoticesData);
   return (
      <NoticesPageClient
         initialCategories={data?.initialCategories}
         initialNotices={data?.initialNotices}
      />
   );
}
