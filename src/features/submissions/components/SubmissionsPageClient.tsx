'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { hasUnsavedChanges } from '@/lib/navigationGuard';
import BoxesTab from './BoxesTab/BoxesTab';
import FormsTab from './FormsTab/FormsTab';
import StudentSubmissionsPageClient from './StudentSubmissionsPageClient';

type Tab = 'boxes' | 'forms';

const TABS: Array<{ key: Tab; label: string }> = [
   { key: 'boxes', label: '제출함' },
   { key: 'forms', label: '설문·평가 폼' },
];

export default function SubmissionsPageClient() {
   const { role } = useAuth();
   const searchParams = useSearchParams();
   const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'forms' ? 'forms' : 'boxes');
   const [isCreating, setIsCreating] = useState(false);
   // 제출함/설문 생성 폼이 저장 안 된 채로 열려 있을 때 다른 탭으로 넘어가면 그 입력이 그대로
   // 사라지므로, Menubar의 사이드바 이동 가드와 동일한 방식으로 한 번 더 확인받는다
   const [pendingTab, setPendingTab] = useState<Tab | null>(null);

   if (role === 'STUDENT') return <StudentSubmissionsPageClient />;

   const switchTab = (next: Tab) => {
      setTab(next);
      setIsCreating(false);
   };

   const handleTabChange = (next: Tab) => {
      if (next === tab) return;
      if (hasUnsavedChanges()) {
         setPendingTab(next);
         return;
      }
      switchTab(next);
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">제출물 관리</h1>

         <div className="flex items-center justify-between border-b border-[#E5E7EB]">
            <div className="mt-5 flex gap-6">
               {TABS.map((item) => {
                  const isActive = tab === item.key;

                  return (
                     <button
                        key={item.key}
                        type="button"
                        onClick={() => handleTabChange(item.key)}
                        className={`cursor-pointer border-b-2 pb-3 text-sm transition-colors ${
                           isActive
                              ? 'font-bold border-brand-green text-[#111827]'
                              : 'font-medium border-transparent text-[#9CA3AF] hover:text-gray-700'
                        }`}
                     >
                        {item.label}
                     </button>
                  );
               })}
            </div>

            <button
               type="button"
               onClick={() => setIsCreating(true)}
               disabled={isCreating}
               className="mt-2 cursor-pointer rounded-xs bg-brand-green px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:opacity-50"
            >
               {tab === 'boxes' ? '+ 제출함 생성' : '+ 설문/평가 폼 생성'}
            </button>
         </div>

         <div className="mt-6">
            {tab === 'boxes' ? (
               <BoxesTab isCreating={isCreating} onCreatingChange={setIsCreating} />
            ) : (
               <FormsTab isCreating={isCreating} onCreatingChange={setIsCreating} />
            )}
         </div>

         <ConfirmModal
            open={!!pendingTab}
            title="저장하지 않은 변경사항이 있습니다"
            description="지금 나가면 변경사항이 저장되지 않습니다. 그래도 나가시겠습니까?"
            confirmLabel="나가기"
            variant="danger"
            onConfirm={() => {
               if (pendingTab) switchTab(pendingTab);
               setPendingTab(null);
            }}
            onClose={() => setPendingTab(null)}
         />
      </div>
   );
}
