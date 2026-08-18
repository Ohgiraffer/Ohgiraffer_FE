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
import SignatureRegisterModal from './SignatureRegisterModal';

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

function getTabsForRole(role: string | null): Tab[] {
   if (role === 'STUDENT') return STUDENT_TABS;
   if (role === 'MANAGER') return MANAGER_TABS;
   return STAFF_TABS;
}

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

   const [lastSyncedRole, setLastSyncedRole] = useState(role);
   if (role !== lastSyncedRole) {
      setLastSyncedRole(role);
      setActiveTab(resolveInitialTab(role, requestedTab));
   }

   const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {role === 'MANAGER' ? '결재 처리' : '전자결재'}
         </h1>

         <div className="mt-5 flex items-end justify-between border-b border-[#E5E7EB]">
            <div className="flex gap-6">
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

            {role === 'MANAGER' && (
               <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="mb-3 cursor-pointer rounded-xs border border-brand-green bg-white px-3 py-1.5 text-sm font-semibold text-brand-green hover:bg-gray-50"
               >
                  전자 서명 등록
               </button>
            )}
         </div>

         <div className="mt-6">
            {activeTab === 'apply' && role === 'STUDENT' && <LeaveRequestForm />}
            {activeTab === 'apply' && role === 'INSTRUCTOR' && <PurchaseBudgetRequestForm />}
            {activeTab === 'history' && <ApprovalHistoryList />}
            {activeTab === 'process' && <ApprovalProcessingList />}
            {activeTab === 'budget' && role === 'MANAGER' && <BudgetManagementTab />}
            {activeTab === 'budget' && role === 'INSTRUCTOR' && <InstructorBudgetTab />}
         </div>

         {isSignatureModalOpen && (
            <SignatureRegisterModal onClose={() => setIsSignatureModalOpen(false)} />
         )}
      </div>
   );
}
