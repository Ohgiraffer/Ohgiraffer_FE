'use client';

import { Check, RefreshCw } from 'lucide-react';
import AiSyncSummaryCard from '../components/AiSyncSummaryCard';
import type { SyncHistoryEntry } from '../types';

type Props = {
   isConnected: boolean;
   latestSync: SyncHistoryEntry | null;
   isSyncing: boolean;
   onRunSync: () => Promise<void>;
   onNotifyStaff: () => Promise<void>;
};

// "동기화 실행" 탭 - 연결된 Google Sheet에서 데이터를 가져와 AI가 변경 사항을 분석한다.
// "연동 설정" 탭에서 연동이 끝나지 않았으면 안내만 보여주고 실행 버튼 자체를 노출하지 않는다
export default function SyncRunTab({
   isConnected,
   latestSync,
   isSyncing,
   onRunSync,
   onNotifyStaff,
}: Props) {
   if (!isConnected) {
      return (
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-16 text-center text-sm text-gray-400">
            먼저 [연동 설정] 탭에서 Google Sheet 연동을 완료해주세요.
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-6">
         <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
            <h3 className="text-sm font-bold text-gray-900">동기화 실행</h3>
            <p className="mt-1 text-sm text-gray-500">
               연결된 Google Sheet에서 평가 데이터를 가져와 AI가 변경 사항을 분석합니다.
            </p>
            <div className="mt-4 flex items-center gap-3">
               <button
                  type="button"
                  onClick={onRunSync}
                  disabled={isSyncing}
                  className="flex cursor-pointer items-center gap-1.5 rounded-sm bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  {isSyncing ? '동기화 중...' : '동기화 실행'}
               </button>
               {latestSync && !isSyncing && (
                  <span className="flex items-center gap-1 text-sm text-brand-green">
                     <Check size={16} />
                     동기화 완료
                  </span>
               )}
            </div>
         </div>

         {latestSync && (
            <AiSyncSummaryCard
               subtitle="방금 동기화"
               items={latestSync.summary}
               footer={
                  <button
                     type="button"
                     onClick={onNotifyStaff}
                     className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                     수정 완료 알림 보내기
                  </button>
               }
            />
         )}
      </div>
   );
}
