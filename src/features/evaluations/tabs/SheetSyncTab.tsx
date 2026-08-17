'use client';

import { useState } from 'react';
import GoogleSheetSync, {
   type GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import { Skeleton } from '@/components/ui/loading/Skeleton';
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

   if (isLoading) {
      return (
         <div className="rounded-sm border bg-white border-gray-200 p-5">
            <Skeleton width={140} height={14} className="rounded-md" />

            <div className="mt-4 rounded-xs border border-[#C8D9CE] bg-[#F0F4F2] px-6 py-5">
               <Skeleton width="70%" height={12} className="rounded-md" />
               <div className="mt-2 flex gap-2">
                  <Skeleton width="100%" height={32} className="flex-1 rounded-xs" />
                  <Skeleton width={64} height={32} className="shrink-0 rounded-xs" />
               </div>

               <Skeleton width={90} height={12} className="mt-4 rounded-md" />
               <div className="mt-2 flex gap-2">
                  <Skeleton width="100%" height={32} className="flex-1 rounded-xs" />
                  <Skeleton width={72} height={32} className="shrink-0 rounded-xs" />
               </div>
            </div>

            <div className="mt-5">
               <Skeleton width={70} height={14} className="rounded-md" />
               <div className="mt-3 grid grid-cols-3 gap-4">
                  {EVALUATION_SHEET_COLUMNS.map((column) => (
                     <div key={column.key} className="px-1.5">
                        <Skeleton width={70} height={13} className="rounded-md" />
                        <Skeleton width="100%" height={40} className="mt-2 rounded-xs" />
                     </div>
                  ))}
               </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
               <Skeleton width={88} height={36} className="rounded-xs" />
            </div>
         </div>
      );
   }

   if (loadError) {
      return (
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
   }

   return (
      <div className="flex flex-col gap-4">
         <GoogleSheetSync
            columns={EVALUATION_SHEET_COLUMNS}
            onSave={onSaveMapping}
            initialConnection={
               isConnected && columnMapping
                  ? { spreadsheetUrl, columnMapping: columnMapping as unknown as Record<string, string> }
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
