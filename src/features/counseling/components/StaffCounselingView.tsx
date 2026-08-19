'use client';

import { useState } from 'react';
import AvailabilityRegisterTab from '../tabs/AvailabilityRegisterTab';
import StaffHistoryTab from '../tabs/StaffHistoryTab';
import type { ServerStaffCounselingData } from '../getServerCounselingData';

type StaffTab = 'history' | 'availability';

const TABS: Array<{ key: StaffTab; label: string }> = [
   { key: 'history', label: '상담 이력 조회' },
   { key: 'availability', label: '가능 시간 등록' },
];

interface StaffCounselingViewProps {
   initialData?: ServerStaffCounselingData;
}

// 운영진(강사·매니저) "상담 관리" - 탭 바 + 탭 전환
export default function StaffCounselingView({ initialData }: StaffCounselingViewProps) {
   const [activeTab, setActiveTab] = useState<StaffTab>('history');

   return (
      <div>
         <div className="flex gap-6 border-b border-[#E5E7EB]">
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
            {activeTab === 'history' && <StaffHistoryTab initialData={initialData} />}
            {activeTab === 'availability' && <AvailabilityRegisterTab />}
         </div>
      </div>
   );
}
