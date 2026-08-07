'use client';

import { useState } from 'react';

type TabKey = 'apply' | 'history' | 'budget';

const TABS: { key: TabKey; label: string }[] = [
   { key: 'apply', label: '결재 신청' },
   { key: 'history', label: '결재 이력' },
   { key: 'budget', label: '예산 관리' },
];

// 강사 전자결재 페이지 - 탭 레이아웃만 우선 구성, 각 탭 콘텐츠는 다음 작업에서 채울 예정
export default function InstructorApprovalsClient() {
   const [activeTab, setActiveTab] = useState<TabKey>('apply');

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">전자결재</h1>

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
            {/* TODO: 탭별 콘텐츠(결재 신청 폼 / 결재 이력 / 예산 관리 대시보드) 구현 예정 */}
         </div>
      </div>
   );
}
