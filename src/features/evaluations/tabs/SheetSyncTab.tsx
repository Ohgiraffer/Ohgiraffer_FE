'use client';

import { useState } from 'react';
import GoogleSheetSync, {
   type GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import AnimatedHeight from '@/components/ui/loading/AnimatedHeight';
import { EVALUATION_SHEET_COLUMNS } from '../hooks/useEvaluationSheetSync';
import SyncRunTab from './SyncRunTab';
import type { SyncHistoryEntry } from '../types';
import type { EvaluationSheetColumnMapping } from '@/services/evaluation.service';

type Props = {
   isConnected: boolean;
   spreadsheetUrl: string;
   columnMapping: EvaluationSheetColumnMapping | null;
   isLoading: boolean;
   loadError: boolean;
   onSaveMapping: (result: GoogleSheetSaveResult) => Promise<void>;
   latestSync: SyncHistoryEntry | null;
   isSyncing: boolean;
   onRunSync: () => Promise<void>;
   isNotifying: boolean;
   onNotifyStaff: () => Promise<void>;
};

// 연동 전(입력 폼)/연동 후(연결됨 카드)가 서로 완전히 다른 모양이라 로딩 중엔 어느 쪽이 나올지
// 알 수 없다 - 특정 상태를 확신하는 스켈레톤 대신, 두 카드 자리만 중립적으로 표시해둔다.
// 실제 크기 차이는 AnimatedHeight가 흡수한다
function SheetSyncTabSkeleton() {
   return (
      <div className="flex flex-col gap-4">
         <div className="rounded-sm border border-gray-200 bg-white p-5">
            <Skeleton width={140} height={16} className="rounded-md" />
            <Skeleton width="100%" height={56} className="mt-4 rounded-xs" />
         </div>
         <div className="rounded-sm border border-gray-200 bg-white p-6">
            <Skeleton width={100} height={16} className="rounded-md" />
            <Skeleton width="70%" height={14} className="mt-2 rounded-md" />
            <Skeleton width={120} height={36} className="mt-3 rounded-xs" />
         </div>
      </div>
   );
}

export default function SheetSyncTab({
   isConnected,
   spreadsheetUrl,
   columnMapping,
   isLoading,
   loadError,
   onSaveMapping,
   latestSync,
   isSyncing,
   onRunSync,
   isNotifying,
   onNotifyStaff,
}: Props) {
   const [isEditingSheetLink, setIsEditingSheetLink] = useState(false);

   let content: React.ReactNode;

   if (isLoading) {
      content = <SheetSyncTabSkeleton />;
   } else if (loadError) {
      content = (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">연동 설정을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={() => window.location.reload()}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   } else {
      content = (
         <div className="flex flex-col gap-4">
            <GoogleSheetSync
               columns={EVALUATION_SHEET_COLUMNS}
               onSave={onSaveMapping}
               initialConnection={
                  isConnected && columnMapping
                     ? {
                          spreadsheetUrl,
                          columnMapping: columnMapping as unknown as Record<string, string>,
                       }
                     : undefined
               }
               onSavedStateChange={(saved) => setIsEditingSheetLink(!saved)}
            />
            <SyncRunTab
               isConnected={isConnected && !isEditingSheetLink}
               latestSync={latestSync}
               isSyncing={isSyncing}
               onRunSync={onRunSync}
               isNotifying={isNotifying}
               onNotifyStaff={onNotifyStaff}
            />
         </div>
      );
   }

   return (
      <AnimatedHeight transitionKey={isLoading ? 'loading' : loadError ? 'error' : 'content'}>
         {content}
      </AnimatedHeight>
   );
}
