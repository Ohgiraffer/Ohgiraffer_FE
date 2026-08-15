'use client';

import { useState } from 'react';
import GoogleSheetSync, {
   type GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
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
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
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
