'use client';

import { useState } from 'react';
import StatusTab from '../tabs/StatusTab';
import SheetSyncTab from '../tabs/SheetSyncTab';
import type { ServerManagerTrackerData } from '../getServerManagerTrackerData';

type TabKey = 'status' | 'sheet-sync';

const TABS: Array<{ key: TabKey; label: string }> = [
   { key: 'status', label: '현황' },
   { key: 'sheet-sync', label: '연동 설정' },
];

interface ManagerTrackerBoardProps {
   initialData?: ServerManagerTrackerData;
}

// 운영진(강사·매니저) 전용 - "훈련생 관리". 현황/연동 설정 탭으로 구성
export default function ManagerTrackerBoard({ initialData }: ManagerTrackerBoardProps) {
   const [activeTab, setActiveTab] = useState<TabKey>('status');

   // StatusTab은 '현황' 탭이 활성화될 때만 마운트되는 구조라, "연동 설정" 탭에 갔다가 돌아오면
   // 매번 언마운트·재마운트된다. initialData(부모의 같은 값)를 매번 그대로 넘기면 StatusTab
   // 내부의 "프리페치된 값이 있으면 첫 조회를 건너뛴다" 로직이 재마운트 때마다 다시 발동해서,
   // 그 사이 바뀐 출결 현황이 있어도 최초 페이지 진입 시점의 오래된 통계로 되돌아간다. 그래서
   // '현황' 탭을 떠나는 순간(=그 탭이 실제로 한 번 프리페치 값을 소비한 뒤) "소비됨"으로
   // 표시해두고, 그 뒤로는 undefined를 넘겨 매번 새로 조회하게 한다(렌더 중 이전 값과 비교해
   // 조정하는 패턴 - hasSeededActivePeriod와 동일한 이유)
   const [prevTab, setPrevTab] = useState<TabKey>(activeTab);
   const [consumedInitialData, setConsumedInitialData] = useState(false);
   if (activeTab !== prevTab) {
      setPrevTab(activeTab);
      if (prevTab === 'status') setConsumedInitialData(true);
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">훈련생 관리</h1>

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
            {activeTab === 'status' && (
               <StatusTab
                  onGoToSheetSync={() => setActiveTab('sheet-sync')}
                  initialData={consumedInitialData ? undefined : initialData}
               />
            )}
            {activeTab === 'sheet-sync' && <SheetSyncTab />}
         </div>
      </div>
   );
}
