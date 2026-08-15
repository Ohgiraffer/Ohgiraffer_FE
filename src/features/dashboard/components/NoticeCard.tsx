'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Megaphone, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { getNoticeSummary, type NoticeSummaryItem } from '@/services/notice.service';

export default function NoticeCard() {
   const [notices, setNotices] = useState<NoticeSummaryItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getNoticeSummary()
         .then((result) => {
            if (isMounted) setNotices(result);
         })
         .catch(() => {
            if (isMounted) setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   return (
      <div className="h-full rounded-xs border border-gray-200 bg-white p-6 lg:p-6">
         <div className="mb-4 flex items-center justify-between lg:mb-4">
            <h2 className="flex items-center gap-1.5 -ml-1 text-sm font-bold text-gray-900">
               <Megaphone size={16} className="text-gray-400" />
               공지사항
            </h2>
            <Link href="/notices" className="text-xs text-gray-400 hover:text-gray-600">
               더보기
            </Link>
         </div>

         {isLoading ? (
            <ul className="flex flex-col gap-1">
               {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 lg:py-3">
                     <Skeleton width="65%" height={14} className="rounded-md" />
                     <Skeleton width={48} height={12} className="rounded-md" />
                  </li>
               ))}
            </ul>
         ) : hasError ? (
            <div className="flex flex-col items-center gap-2 py-6">
               <p className="text-sm text-gray-400">공지사항을 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={() => {
                     setIsLoading(true);
                     setHasError(false);
                     setRetryKey((key) => key + 1);
                  }}
                  className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : notices.length === 0 ? (
            <p className="break-keep py-6 text-center text-sm text-gray-400">표시할 공지사항이 없습니다</p>
         ) : (
            <ul className="flex flex-col gap-1">
               {notices.map((notice) => (
                  <li key={notice.noticeId}>
                     <Link
                        href={`/notices/${notice.noticeId}`}
                        className={cn(
                           'flex items-center justify-between gap-3 py-2 text-sm text-gray-600 lg:py-3',
                           notice.pinned &&
                              '-ml-2 border-l-2 border-brand-red pl-2 font-medium text-gray-900',
                        )}
                     >
                        <span className="flex min-w-0 items-center gap-1.5">
                           {notice.pinned && <Pin size={12} className="shrink-0 text-brand-red" />}
                           <span className="truncate">{notice.title}</span>
                        </span>
                        <span className="shrink-0 text-xs text-gray-400">
                           {format(new Date(notice.createdAt), 'M월 d일', { locale: ko })}
                        </span>
                     </Link>
                  </li>
               ))}
            </ul>
         )}
      </div>
   );
}
