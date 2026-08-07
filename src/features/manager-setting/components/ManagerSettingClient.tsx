'use client';

import { useState } from 'react';
import OrgAttendanceApprovalTab from '../tabs/OrgAttendanceApprovalTab';
import UserPermissionTab from '../tabs/UserPermissionTab';
import ChangeHistoryTab from '../tabs/ChangeHistoryTab';
import type { ManagerSettingTab } from '../types';

const TABS: Array<{ key: ManagerSettingTab; label: string }> = [
   { key: 'org', label: '조직·출결 설정' },
   { key: 'users', label: '사용자 및 권한 관리' },
   { key: 'history', label: '변경 이력' },
];

export default function ManagerSettingClient() {
   const [activeTab, setActiveTab] = useState<ManagerSettingTab>('org');

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">관리자 설정</h1>

         <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
            {TABS.map((tab) => {
               const isActive = activeTab === tab.key;

               return (
                  <button
                     key={tab.key}
                     type="button"
                     onClick={() => setActiveTab(tab.key)}
                     className={`cursor-pointer border-b-2 pb-3 text-sm transition-colors ${
                        isActive
                           ? 'font-bold border-brand-green text-[#111827]'
                           : 'font-medium border-transparent text-[#9CA3AF] hover:text-gray-700'
                     }`}
                  >
                     {tab.label}
                  </button>
               );
            })}
         </div>

         <div className="mt-6">
            {activeTab === 'org' && <OrgAttendanceApprovalTab />}
            {activeTab === 'users' && <UserPermissionTab />}
            {activeTab === 'history' && <ChangeHistoryTab />}
         </div>
      </div>
   );
}
