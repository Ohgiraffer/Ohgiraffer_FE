'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import ApprovalHistoryList from '../tabs/ApprovalHistoryList';
import ApprovalProcessingList from '../tabs/ApprovalProcessingList';
import BudgetManagementTab from '../tabs/BudgetManagementTab';
import InstructorBudgetTab from '../tabs/InstructorBudgetTab';
import LeaveRequestForm from '../tabs/LeaveRequestForm';
import PurchaseBudgetRequestForm from '../tabs/PurchaseBudgetRequestForm';

type TabKey = 'apply' | 'history' | 'budget' | 'process';

type Tab = { key: TabKey; label: string };

const STUDENT_TABS: Tab[] = [
   { key: 'apply', label: '결재 신청' },
   { key: 'history', label: '결재 이력' },
];

const STAFF_TABS: Tab[] = [
   { key: 'apply', label: '결재 신청' },
   { key: 'history', label: '결재 이력' },
   { key: 'budget', label: '예산 관리' },
];

const MANAGER_TABS: Tab[] = [
   { key: 'process', label: '결재 처리' },
   { key: 'budget', label: '예산 관리' },
];

// role별로 보이는 탭 구성이 다름 - 훈련생은 결재신청(휴가)/결재이력, 강사는 여기에 예산관리가 더 붙고,
// 매니저는 결재신청 대신 결재처리 + 예산관리(구글 시트 연동 화면이라 강사와는 다른 내용)를 봄
function getTabsForRole(role: string | null): Tab[] {
   if (role === 'STUDENT') return STUDENT_TABS;
   if (role === 'MANAGER') return MANAGER_TABS;
   return STAFF_TABS;
}

// 결재 이력 상세 화면의 "목록으로 돌아가기"가 ?tab=history로 넘어오는 경우처럼, 쿼리로 넘어온 탭이
// 현재 role에서 유효할 때만 그 탭을 초기값으로 쓰고, 아니면 role의 첫 탭으로 대체한다
function resolveInitialTab(role: string | null, requestedTab: string | null): TabKey {
   const tabs = getTabsForRole(role);
   const matched = tabs.find((tab) => tab.key === requestedTab);
   return (matched ?? tabs[0]).key;
}

export default function ApprovalsPageClient() {
   const { role } = useAuth();
   const requestedTab = useSearchParams().get('tab');
   const tabs = getTabsForRole(role);
   const [activeTab, setActiveTab] = useState<TabKey>(() => resolveInitialTab(role, requestedTab));

   // role 확인 전(null)엔 기본값(STAFF_TABS)으로 렌더링되므로, 실제 role이 확정되면 그 role의 첫 탭으로
   // 다시 맞춰줘야 함 - useEffect 대신 렌더링 중 state를 조정하는 방식(리액트 공식 권장 패턴)으로 처리
   const [lastSyncedRole, setLastSyncedRole] = useState(role);
   if (role !== lastSyncedRole) {
      setLastSyncedRole(role);
      setActiveTab(resolveInitialTab(role, requestedTab));
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {role === 'MANAGER' ? '결재 처리' : '전자결재'}
         </h1>

         <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
            {tabs.map((tab) => (
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
            {activeTab === 'apply' && role === 'STUDENT' && <LeaveRequestForm />}
            {activeTab === 'apply' && role === 'INSTRUCTOR' && <PurchaseBudgetRequestForm />}
            {activeTab === 'history' && <ApprovalHistoryList />}
            {activeTab === 'process' && <ApprovalProcessingList />}
            {activeTab === 'budget' && role === 'MANAGER' && <BudgetManagementTab />}
            {activeTab === 'budget' && role === 'INSTRUCTOR' && <InstructorBudgetTab />}
         </div>
      </div>
   );
}
