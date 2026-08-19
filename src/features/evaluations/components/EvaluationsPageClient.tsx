'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SheetSyncTab from '../tabs/SheetSyncTab';
import SyncHistoryTab from '../tabs/SyncHistoryTab';
import { useEvaluationSheetSync } from '../hooks/useEvaluationSheetSync';
import { useSyncHistory } from '../hooks/useSyncHistory';
import type { ServerEvaluationsData } from '../getServerEvaluationsData';

type TabKey = 'sheet-sync' | 'history';

const TABS: Array<{ key: TabKey; label: string }> = [
   { key: 'sheet-sync', label: '연동 설정' },
   { key: 'history', label: '이력' },
];

function resolveInitialTab(requestedTab: string | null): TabKey {
   const matched = TABS.find((tab) => tab.key === requestedTab);
   return (matched ?? TABS[0]).key;
}

interface EvaluationsPageClientProps {
   // evaluations/page.tsx가 서버에서 미리 불러와 넘겨주는 초기 데이터 - 없으면(캐시 히트, 검증 실패
   // 등) 지금처럼 클라이언트에서 직접 불러온다
   initialData?: ServerEvaluationsData;
}

export default function EvaluationsPageClient({ initialData }: EvaluationsPageClientProps) {
   const router = useRouter();
   const requestedTab = useSearchParams().get('tab');
   const [activeTab, setActiveTab] = useState<TabKey>(() => resolveInitialTab(requestedTab));
   const { isConnected, spreadsheetUrl, columnMapping, isLoading, loadError, handleSaveMapping } =
      useEvaluationSheetSync(initialData?.initialSheetLink);
   const {
      history,
      isLoadingHistory,
      historyError,
      latestSync,
      isSyncing,
      runSync,
      isNotifying,
      notifyStaff,
   } = useSyncHistory(initialData?.initialSyncLogs);

   const changeTab = (tab: TabKey) => {
      setActiveTab(tab);
      router.replace(`/evaluations?tab=${tab}`);
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">평가 관리</h1>

         <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
            {TABS.map((tab) => (
               <button
                  key={tab.key}
                  type="button"
                  onClick={() => changeTab(tab.key)}
                  className={`cursor-pointer border-b-2 pb-3 text-sm transition-colors ${
                     activeTab === tab.key
                        ? 'border-brand-green font-bold text-[#111827]'
                        : 'border-transparent font-medium text-[#9CA3AF] hover:text-gray-700'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>

         <div className="mt-6">
            {activeTab === 'sheet-sync' && (
               <SheetSyncTab
                  isConnected={isConnected}
                  spreadsheetUrl={spreadsheetUrl}
                  columnMapping={columnMapping}
                  isLoading={isLoading}
                  loadError={loadError}
                  onSaveMapping={handleSaveMapping}
                  latestSync={latestSync}
                  isSyncing={isSyncing}
                  onRunSync={runSync}
                  isNotifying={isNotifying}
                  onNotifyStaff={notifyStaff}
               />
            )}
            {activeTab === 'history' && (
               <SyncHistoryTab
                  history={history}
                  isLoadingHistory={isLoadingHistory}
                  historyError={historyError}
               />
            )}
         </div>
      </div>
   );
}
