import { useState } from 'react';
import { Sparkles, TriangleAlert } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import type { EvaluationSyncSkippedRow, EvaluationSyncSummaryCard } from '@/services/evaluation.service';

const PAGE_SIZE = 3;

type Props = {
   subtitle: string;
   changedCount: number;
   summaries: EvaluationSyncSummaryCard[];
   addedCount?: number;
   updatedCount?: number;
   skipped?: EvaluationSyncSkippedRow[];
   footer?: React.ReactNode;
};

// "AI 수정사항 요약" 카드 - 동기화 실행 직후/이력 상세 공용.
// summaries는 훈련생당 카드 하나(한 사람이 여러 항목에서 바뀌어도 하나로 묶여서 온다)
export default function AiSyncSummaryCard({
   subtitle,
   changedCount,
   summaries,
   addedCount,
   updatedCount,
   skipped,
   footer,
}: Props) {
   const [currentPage, setCurrentPage] = useState(1);
   // 다른 동기화 실행/이력의 카드로 전환되면 이전에 보던 페이지 번호가 그대로 남지 않도록 초기화
   const [prevSummaries, setPrevSummaries] = useState(summaries);
   if (summaries !== prevSummaries) {
      setPrevSummaries(summaries);
      setCurrentPage(1);
   }

   const totalPages = Math.max(1, Math.ceil(summaries.length / PAGE_SIZE));
   const pagedSummaries = summaries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
         <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Sparkles size={16} className="text-brand-gold" />
            AI 수정사항 요약
            <span className="text-xs font-normal text-gray-400">{subtitle}</span>
         </div>

         {addedCount !== undefined && updatedCount !== undefined ? (
            changedCount > 0 && (
               <div className="mt-3 flex divide-x divide-[#F3F4F6] rounded-xs border border-[#F3F4F6] bg-[#F9FAFB]">
                  <div className="flex-1 px-4 py-3 text-center">
                     <p className="text-xs text-gray-400">신규 등록</p>
                     <p className="mt-1 text-[14px] font-bold text-brand-sage">{addedCount}건</p>
                  </div>
                  <div className="flex-1 px-4 py-3 text-center">
                     <p className="text-xs text-gray-400">수정</p>
                     <p className="mt-1 text-[14px] font-bold text-brand-sage">{updatedCount}건</p>
                  </div>
                  <div className="flex-1 px-4 py-3 text-center">
                     <p className="text-xs text-gray-400">총 변경</p>
                     <p className="mt-1 text-[14px] font-bold text-gray-900">{changedCount}건</p>
                  </div>
               </div>
            )
         ) : (
            changedCount > 0 && (
               <p className="mt-3 text-sm font-semibold text-gray-900">총 변경 {changedCount}건</p>
            )
         )}

         {/* changedCount === 0은 이력 자체가 없는 "방금 동기화했는데 변경이 없음" 경우에만 나온다
             (이력 목록/상세는 변경이 있었던 실행만 쌓여서 changedCount가 항상 1 이상이다) */}
         {changedCount === 0 && (
            <p className="mt-3 text-sm text-gray-400">변경 사항이 없습니다.</p>
         )}

         {summaries.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
               {pagedSummaries.map((summary, index) => (
                  <div
                     key={`${summary.traineeName}-${index}`}
                     className="rounded-xs border border-[#F3F4F6] bg-[#F9FAFB] p-4"
                  >
                     <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">{summary.traineeName}</p>
                        <span className="rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-xs text-gray-500">
                           {summary.evaluationType}
                        </span>
                     </div>
                     <dl className="mt-2 flex flex-col gap-1">
                        <div className="flex gap-3">
                           <dt className="w-10 shrink-0 text-[14px] text-[#9CA3AF]">항목</dt>
                           <dd className="text-[13px] text-[#374151]">{summary.item}</dd>
                        </div>
                        <div className="flex gap-3">
                           <dt className="w-10 shrink-0 text-[14px] text-[#9CA3AF]">점수</dt>
                           <dd className="text-[13px] text-[#374151]">{summary.score}</dd>
                        </div>
                        <div className="flex gap-3">
                           <dt className="w-10 shrink-0 text-[14px] text-[#9CA3AF]">의견</dt>
                           <dd className="text-[13px] text-[#374151]">{summary.comment}</dd>
                        </div>
                     </dl>
                     {summary.needsCheck && (
                        <div className="mt-3 flex items-start gap-1.5 rounded-xs border border-brand-gold/40 bg-brand-cream/40 px-3 py-2 text-xs text-gray-700">
                           <TriangleAlert size={14} className="mt-0.5 shrink-0 text-brand-gold" />
                           <span>확인 필요 - {summary.needsCheck}</span>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

         {summaries.length > 0 && (
            <div className="mt-3">
               <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
               />
            </div>
         )}

         {/* 카드 형식(summaries)이 생기기 전에 저장된 옛날 이력 - changedCount는 있는데 되살릴 카드가 없다 */}
         {summaries.length === 0 && changedCount > 0 && (
            <p className="mt-3 text-sm text-gray-400">상세 내용이 없습니다.</p>
         )}

         {skipped && skipped.length > 0 && (
            <div className="mt-4 rounded-xs border border-brand-gold/40 bg-brand-cream/40 p-3">
               <p className="text-xs font-semibold text-gray-700">건너뛴 행 {skipped.length}건</p>
               <ul className="mt-1.5 flex flex-col gap-1">
                  {skipped.map((row) => (
                     <li key={row.rowNumber} className="text-xs text-gray-600">
                        <span className="font-medium text-gray-700">{row.rowNumber}행</span> ·{' '}
                        {row.reason}
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {footer && (
            <div className="mt-4 flex justify-end border-t border-[#F3F4F6] pt-4">{footer}</div>
         )}
      </div>
   );
}
