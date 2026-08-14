'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SheetSyncTab from '../tabs/SheetSyncTab';
import SyncHistoryTab from '../tabs/SyncHistoryTab';
import { useEvaluationSheetSync } from '../hooks/useEvaluationSheetSync';
import { useSyncHistory } from '../hooks/useSyncHistory';

type TabKey = 'sheet-sync' | 'history';

// 원래는 "연동 설정"/"동기화 실행"이 별도 탭이었으나, 시트 연동 후 탭을 옮겨 동기화를 실행해야 하는
// 불편함 때문에 하나로 합쳤다(연동 설정 탭 안에서 GoogleSheetSync 아래에 동기화 실행 UI가 이어짐)
const TABS: Array<{ key: TabKey; label: string }> = [
   { key: 'sheet-sync', label: '연동 설정' },
   { key: 'history', label: '이력' },
];

// 이력 상세 화면의 "이력 목록으로 돌아가기"가 ?tab=history로 넘어오는 경우처럼, 쿼리로 넘어온 탭이
// 유효할 때만 그 탭을 초기값으로 쓰고, 아니면 첫 탭으로 대체한다
function resolveInitialTab(requestedTab: string | null): TabKey {
   const matched = TABS.find((tab) => tab.key === requestedTab);
   return (matched ?? TABS[0]).key;
}

// 평가 관리 페이지(운영진 전용) - 연동 설정(+동기화 실행)/이력을 탭으로 묶음.
// 연동 상태(isConnected)와 동기화 이력은 탭을 옮겨도 유지되어야 해서 이 상위 컴포넌트에서 한 번만 관리한다
export default function EvaluationsPageClient() {
   const router = useRouter();
   const requestedTab = useSearchParams().get('tab');
   const [activeTab, setActiveTab] = useState<TabKey>(() => resolveInitialTab(requestedTab));
   const { isConnected, spreadsheetUrl, isLoading, loadError, handleSaveMapping } =
      useEvaluationSheetSync();
   const { history, isLoadingHistory, historyError, latestSync, isSyncing, runSync, notifyStaff } =
      useSyncHistory();

   // URL도 같이 갱신해둬야 새로고침하거나 주소를 공유해도 선택한 탭이 유지된다
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
                  isLoading={isLoading}
                  loadError={loadError}
                  onSaveMapping={handleSaveMapping}
                  latestSync={latestSync}
                  isSyncing={isSyncing}
                  onRunSync={runSync}
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
