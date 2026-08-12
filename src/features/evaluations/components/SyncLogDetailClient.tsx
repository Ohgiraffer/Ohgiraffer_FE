'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { getEvaluationSyncLogDetail, type EvaluationSyncLogSummary } from '@/services/evaluation.service';
import AiSyncSummaryCard from './AiSyncSummaryCard';

interface SyncLogDetailClientProps {
   syncLogId: string;
}

// 이력 상세 - "이력" 탭 목록에서 항목을 선택하면 오는 화면. 목록 API와 응답 형식이 완전히 같아서
// (changedCount/diffSummary만 있고 addedCount/updatedCount/skipped는 없음) AiSyncSummaryCard가
// 그 세부 섹션을 자동으로 숨긴 채로 렌더링한다
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
            // 없는 이력 식별자 - 목록으로 되돌린다
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
               <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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
                  subtitle={`${format(parseISO(detail.syncedAt), 'yyyy.MM.dd HH:mm')} · ${
                     detail.executedByName ?? '알 수 없음'
                  }`}
                  changedCount={detail.changedCount}
                  diffSummary={detail.diffSummary}
               />
            )}
         </div>
      </div>
   );
}
