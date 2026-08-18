'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { getEvaluationSyncLogDetail, type EvaluationSyncLogSummary } from '@/services/evaluation.service';
import { formatSyncedAt } from '../formatSyncedAt';
import AiSyncSummaryCard from './AiSyncSummaryCard';
import { Skeleton } from '@/components/ui/loading/Skeleton';

interface SyncLogDetailClientProps {
   syncLogId: string;
}

export default function SyncLogDetailClient({ syncLogId }: SyncLogDetailClientProps) {
   const router = useRouter();
   const numericSyncLogId = Number(syncLogId);

   const [detail, setDetail] = useState<EvaluationSyncLogSummary | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(numericSyncLogId)) return;
      let isMounted = true;

      getEvaluationSyncLogDetail(numericSyncLogId)
         .then((data) => {
            if (isMounted) setDetail(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            
            if (err instanceof ApiError && err.code === 'EVALUATION_004') {
               toast.error(err.message);
               router.replace('/evaluations?tab=history');
               return;
            }
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [numericSyncLogId, router]);

   if (!Number.isInteger(numericSyncLogId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/evaluations?tab=history"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               이력 목록으로 돌아가기
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">이력을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link
            href="/evaluations?tab=history"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            이력 목록으로 돌아가기
         </Link>

         <div className="mt-4">
            {isLoading ? (
               <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
                  <div className="flex items-center gap-2">
                     <Skeleton width={16} height={16} className="rounded-full" />
                     <Skeleton width={110} height={14} className="rounded-md" />
                     <Skeleton width={140} height={12} className="rounded-md" />
                  </div>
                  {/* 이력 상세는 addedCount/updatedCount 없이 changedCount만 넘기므로,
                      AiSyncSummaryCard는 3분할 통계 박스 대신 "총 변경 N건" 한 줄만 렌더링한다 */}
                  <Skeleton width={120} height={14} className="mt-3 rounded-md" />
                  <div className="mt-3 flex flex-col gap-2">
                     {[0, 1, 2].map((i) => (
                        <div key={i} className="rounded-xs border border-[#F3F4F6] bg-[#F9FAFB] p-4">
                           <div className="flex items-center gap-2">
                              <Skeleton width={80} height={14} className="rounded-md" />
                              <Skeleton width={48} height={18} className="rounded-full" />
                           </div>
                           <div className="mt-2 flex flex-col gap-1.5">
                              <Skeleton width="90%" height={13} className="rounded-md" />
                              <Skeleton width="70%" height={13} className="rounded-md" />
                              <Skeleton width="80%" height={13} className="rounded-md" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ) : hasError || !detail ? (
               <div className="flex flex-col items-center gap-3 py-16">
                  <p className="text-sm text-gray-400">이력을 불러오지 못했습니다.</p>
                  <button
                     type="button"
                     onClick={() => window.location.reload()}
                     className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                     다시 시도
                  </button>
               </div>
            ) : (
               <AiSyncSummaryCard
                  subtitle={`${formatSyncedAt(detail.syncedAt)} · ${
                     detail.executedByName ?? '시스템'
                  }`}
                  changedCount={detail.changedCount}
                  summaries={detail.summaries}
               />
            )}
         </div>
      </div>
   );
}
