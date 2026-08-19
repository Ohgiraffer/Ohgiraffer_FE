'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { hasUnsavedChanges } from '@/lib/navigationGuard';
import BoxesTab from './BoxesTab/BoxesTab';
import FormsTab from './FormsTab/FormsTab';
import type { ServerSubmissionsData } from '../getServerSubmissionsData';

type Tab = 'boxes' | 'forms';

const TABS: Array<{ key: Tab; label: string }> = [
   { key: 'boxes', label: '제출함' },
   { key: 'forms', label: '설문·평가 폼' },
];

interface ManagerSubmissionsPageClientProps {
   initialData?: ServerSubmissionsData;
}

// 운영진(강사·매니저) 전용 "제출물 관리"
export default function ManagerSubmissionsPageClient({
   initialData,
}: ManagerSubmissionsPageClientProps) {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'forms' ? 'forms' : 'boxes');
   const [isCreating, setIsCreating] = useState(false);
   // 제출함/설문 생성 폼이 저장 안 된 채로 열려 있을 때 다른 탭으로 넘어가면 그 입력이 그대로
   // 사라지므로, Menubar의 사이드바 이동 가드와 동일한 방식으로 한 번 더 확인받는다
   const [pendingTab, setPendingTab] = useState<Tab | null>(null);

   // BoxesTab/FormsTab은 각각 탭이 활성화될 때만 마운트되는 구조라, 탭을 전환했다 돌아오면
   // 매번 언마운트·재마운트된다. initialData(부모의 같은 값)를 매번 그대로 넘기면, 그 탭의
   // "프리페치된 값이 있으면 첫 조회를 건너뛴다" 로직이 재마운트 때마다 다시 발동해서 그
   // 사이에 생성/삭제한 내용이 있어도 최초 페이지 진입 시점의 오래된 목록으로 되돌아간다.
   // 그래서 탭을 떠나는 순간(=그 탭이 실제로 한 번 프리페치 값을 소비한 뒤) "소비됨"으로
   // 표시해두고, 그 뒤로는 undefined를 넘겨 매번 새로 조회하게 한다. useEffect가 아니라
   // 렌더 중 이전 값과 비교해 조정하는 패턴을 쓴다(hasSeededActivePeriod와 동일한 이유 -
   // 이 렌더에서 탭이 바뀌는 걸 감지한 그 즉시 반영해야, 새로 보여줄 탭이 아직 소비되지
   // 않은 상태로 이번 렌더에 실제 initialData를 받을 수 있다)
   const [prevTab, setPrevTab] = useState<Tab>(tab);
   const [consumedBoxes, setConsumedBoxes] = useState(false);
   const [consumedForms, setConsumedForms] = useState(false);
   if (tab !== prevTab) {
      setPrevTab(tab);
      if (prevTab === 'boxes') setConsumedBoxes(true);
      else setConsumedForms(true);
   }

   const switchTab = (next: Tab) => {
      setTab(next);
      setIsCreating(false);
      // 상세 페이지로 들어갔다가 브라우저 뒤로가기로 돌아왔을 때도 보고 있던 탭이 유지되도록,
      // 탭을 바꿀 때마다 URL도 함께 맞춰둔다 - 제출함은 기본 탭이라 쿼리 없는 순수 경로를 쓰고,
      // 설문·평가 폼일 때만 ?tab=forms를 붙인다(상세 페이지의 "목록으로" 링크와 동일한 방식)
      router.replace(next === 'forms' ? '/submissions?tab=forms' : '/submissions', {
         scroll: false,
      });
   };

   const handleTabChange = (next: Tab) => {
      // 같은 탭이라도 생성/수정 폼이 열려 있으면(제출함 생성 중 "제출함" 탭 재클릭 등) 그걸 닫고
      // 목록으로 돌아간다 - 폼이 안 열려 있으면 어차피 할 일이 없으니 그대로 종료
      if (next === tab && !isCreating) return;
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
               <BoxesTab
                  isCreating={isCreating}
                  onCreatingChange={setIsCreating}
                  initialBoxes={consumedBoxes ? undefined : initialData?.initialBoxes}
               />
            ) : (
               <FormsTab
                  isCreating={isCreating}
                  onCreatingChange={setIsCreating}
                  initialForms={consumedForms ? undefined : initialData?.initialForms}
               />
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
