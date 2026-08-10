'use client';

import { useState } from 'react';
import SheetSyncTab from '../tabs/SheetSyncTab';
import SyncRunTab from '../tabs/SyncRunTab';
import SyncHistoryTab from '../tabs/SyncHistoryTab';
import { useEvaluationSheetSync } from '../hooks/useEvaluationSheetSync';
import { useSyncHistory } from '../hooks/useSyncHistory';

type TabKey = 'sheet-sync' | 'sync-run' | 'history';

const TABS: Array<{ key: TabKey; label: string }> = [
   { key: 'sheet-sync', label: '연동 설정' },
   { key: 'sync-run', label: '동기화 실행' },
   { key: 'history', label: '이력' },
];

// 평가 관리 페이지(운영진 전용) - 연동 설정/동기화 실행/이력을 탭으로 묶음.
// 연동 상태(isConnected)와 동기화 이력은 탭을 옮겨도 유지되어야 해서 이 상위 컴포넌트에서 한 번만 관리한다
export default function EvaluationsPageClient() {
   const [activeTab, setActiveTab] = useState<TabKey>('sheet-sync');
   const { isConnected, handleSaveMapping } = useEvaluationSheetSync();
   const { history, latestSync, isSyncing, runSync, notifyStaff } = useSyncHistory();

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">평가 관리</h1>

         <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
            {TABS.map((tab) => (
               <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
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
            {activeTab === 'sheet-sync' && <SheetSyncTab onSaveMapping={handleSaveMapping} />}
            {activeTab === 'sync-run' && (
               <SyncRunTab
                  isConnected={isConnected}
                  latestSync={latestSync}
                  isSyncing={isSyncing}
                  onRunSync={runSync}
                  onNotifyStaff={notifyStaff}
               />
            )}
            {activeTab === 'history' && <SyncHistoryTab history={history} />}
         </div>
      </div>
   );
}
