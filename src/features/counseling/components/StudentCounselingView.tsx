'use client';

import { useState } from 'react';
import ApplyCounselingTab from '../tabs/ApplyCounselingTab';
import MyCounselingHistoryTab from '../tabs/MyCounselingHistoryTab';

type StudentTab = 'apply' | 'history';

const TABS: Array<{ key: StudentTab; label: string }> = [
   { key: 'apply', label: '상담 신청' },
   { key: 'history', label: '내 상담 이력' },
];

// 훈련생 "상담 신청 및 이력 조회" - 탭 바 + 탭 전환
export default function StudentCounselingView() {
   const [activeTab, setActiveTab] = useState<StudentTab>('apply');

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
            {activeTab === 'apply' && <ApplyCounselingTab />}
            {activeTab === 'history' && <MyCounselingHistoryTab />}
         </div>
      </div>
   );
}
