import { Sparkles } from 'lucide-react';
import type { EvaluationSyncSkippedRow } from '@/services/evaluation.service';

type Props = {
   // "방금 동기화" 또는 "2026.08.10 14:22 · 이매니저" 같은 부가 설명
   subtitle: string;
   changedCount: number;
   // AI가 정리한 변경 요약 문장(실패 시 목록 형태로 대체되어 옴) - 줄바꿈만 살려서 그대로 보여준다
   diffSummary: string;
   // 이력 목록(GET /evaluations/sync-logs)에는 없는 세부 항목 - 방금 이 화면에서 직접 실행한
   // 동기화 결과에만 있어서, 없으면 신규/수정 건수·건너뛴 행 섹션 자체를 숨긴다
   addedCount?: number;
   updatedCount?: number;
   skipped?: EvaluationSyncSkippedRow[];
   // "수정 완료 알림 보내기" 버튼 - 동기화 직후에만 넘기고, 이력 상세에서는 비워둔다
   footer?: React.ReactNode;
};

// "AI 수정사항 요약" 카드 - 동기화 실행 직후(SyncRunTab)와 이력 상세(SyncLogDetailClient)가 공용으로 씀
export default function AiSyncSummaryCard({
   subtitle,
   changedCount,
   diffSummary,
   addedCount,
   updatedCount,
   skipped,
   footer,
}: Props) {
   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
         <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Sparkles size={16} className="text-brand-gold" />
            AI 수정사항 요약
            <span className="text-xs font-normal text-gray-400">{subtitle}</span>
         </div>

         {addedCount !== undefined && updatedCount !== undefined ? (
            changedCount > 0 && (
               <div className="mt-4 flex divide-x divide-[#F3F4F6] rounded-xs border border-[#F3F4F6] bg-[#F9FAFB]">
                  <div className="flex-1 px-4 py-3 text-center">
                     <p className="text-xs text-gray-400">신규 등록</p>
                     <p className="mt-1 text-sm font-bold text-brand-green">{addedCount}건</p>
                  </div>
                  <div className="flex-1 px-4 py-3 text-center">
                     <p className="text-xs text-gray-400">수정</p>
                     <p className="mt-1 text-sm font-bold text-brand-green">{updatedCount}건</p>
                  </div>
                  <div className="flex-1 px-4 py-3 text-center">
                     <p className="text-xs text-gray-400">총 변경</p>
                     <p className="mt-1 text-sm font-bold text-gray-900">{changedCount}건</p>
                  </div>
               </div>
            )
         ) : (
            changedCount > 0 && (
               <p className="mt-3 text-sm font-semibold text-gray-900">총 변경 {changedCount}건</p>
            )
         )}

         <p className="mt-4 whitespace-pre-line text-sm text-gray-700">{diffSummary}</p>

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
