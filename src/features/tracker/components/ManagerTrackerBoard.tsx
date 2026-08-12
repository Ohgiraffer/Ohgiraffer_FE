'use client';

import { useState } from 'react';
import StatusTab from '../tabs/StatusTab';
import SheetSyncTab from '../tabs/SheetSyncTab';

type TabKey = 'status' | 'sheet-sync';

const TABS: Array<{ key: TabKey; label: string }> = [
   { key: 'status', label: '현황' },
   { key: 'sheet-sync', label: '연동 설정' },
];

// 운영진(강사·매니저) 전용 - "훈련생 관리". 현황/연동 설정 탭으로 구성
export default function ManagerTrackerBoard() {
   const [activeTab, setActiveTab] = useState<TabKey>('status');

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
            {activeTab === 'status' && <StatusTab />}
            {activeTab === 'sheet-sync' && <SheetSyncTab />}
         </div>
      </div>
   );
}
