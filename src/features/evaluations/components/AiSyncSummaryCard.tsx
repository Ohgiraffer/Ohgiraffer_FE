import { Sparkles } from 'lucide-react';
import type { AiSyncSummaryItem } from '../types';

type Props = {
   // "방금 동기화" 또는 "2025.07.30 14:22 · 이매니저" 같은 부가 설명
   subtitle: string;
   items: AiSyncSummaryItem[];
   // "수정 완료 알림 보내기" 버튼 - 동기화 직후에만 넘기고, 이력 상세에서는 비워둔다
   footer?: React.ReactNode;
};

// "AI 수정사항 요약" 카드 - 동기화 실행 직후(SyncRunTab)와 이력 상세(SyncHistoryDetail)가 공용으로 씀
export default function AiSyncSummaryCard({ subtitle, items, footer }: Props) {
   return (
      <div className="rounded-sm border border-brand-gold bg-white p-6">
         <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Sparkles size={16} className="text-brand-gold" />
            AI 수정사항 요약
            <span className="text-xs font-normal text-gray-400">{subtitle}</span>
         </div>

         <div className="mt-4 flex flex-col divide-y divide-[#F3F4F6]">
            {items.map((item) => (
               <div key={item.traineeId} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600">
                     {item.traineeName.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                     <p className="font-semibold text-gray-900">{item.traineeName}</p>
                     <div className="mt-1.5 flex flex-col gap-1">
                        {item.scoreChange !== null && (
                           <div className="flex gap-2">
                              <span className="w-16 shrink-0 text-gray-400">점수 변화</span>
                              <span
                                 className={`font-semibold ${
                                    item.scoreChange >= 0 ? 'text-brand-green' : 'text-brand-maroon'
                                 }`}
                              >
                                 {item.scoreChange >= 0 ? '+' : ''}
                                 {item.scoreChange}점
                              </span>
                           </div>
                        )}
                        <div className="flex gap-2">
                           <span className="w-16 shrink-0 text-gray-400">주요 의견</span>
                           <span className="text-gray-700">{item.comment}</span>
                        </div>
                        {item.needsCheckNote && (
                           <div className="flex flex-wrap items-center gap-2">
                              <span className="w-16 shrink-0 text-gray-400">확인 필요</span>
                              <span className="rounded-xs bg-[#F5DFDC] px-2 py-0.5 text-xs font-semibold text-[#C0392B]">
                                 확인 필요
                              </span>
                              <span className="text-gray-700">{item.needsCheckNote}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            ))}
         </div>

         {footer && (
            <div className="mt-4 flex justify-end border-t border-[#F3F4F6] pt-4">{footer}</div>
         )}
      </div>
   );
}
