'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
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

   if (role === 'STUDENT') return <StudentSubmissionsPageClient />;

   const handleTabChange = (next: Tab) => {
      setTab(next);
      setIsCreating(false);
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
      </div>
   );
}
