'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from '@/lib/toast';

interface TeamAddCardProps {
   // 지금 이 기간에 이미 있는 팀명들 - 중복 방지용(다른 기간의 팀명과는 겹쳐도 된다)
   existingNames: string[];
   onCreate: (name: string) => void;
}

// 그리드 맨 끝의 점선 "+ 팀 추가" 카드 - 클릭하면 이 카드 자리 자체가 이름 입력 폼으로 바뀐다
// (별도 모달 없음). TeamCard.tsx의 팀명 인라인 수정과 같은 상호작용 패턴
export default function TeamAddCard({ existingNames, onCreate }: TeamAddCardProps) {
   const [isEditing, setIsEditing] = useState(false);
   const [nameDraft, setNameDraft] = useState('');

   const startEditing = () => {
      setNameDraft('');
      setIsEditing(true);
   };

   const commit = () => {
      const trimmed = nameDraft.trim();
      if (!trimmed) return;
      if (existingNames.includes(trimmed)) {
         toast.error('이미 같은 이름의 팀이 있습니다.');
         return;
      }
      onCreate(trimmed);
      setNameDraft('');
      setIsEditing(false);
   };

   if (isEditing) {
      return (
         <div className="flex h-fit items-center gap-2 rounded-xs border border-dashed border-brand-green bg-white px-4 py-2.5">
            <input
               autoFocus
               value={nameDraft}
               onChange={(e) => setNameDraft(e.target.value)}
               onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setIsEditing(false);
               }}
               onBlur={() => {
                  if (!nameDraft.trim()) setIsEditing(false);
               }}
               placeholder="팀명 입력"
               className="h-7 min-w-0 flex-1 border-b border-gray-300 px-0.5 text-sm font-medium text-gray-900 focus:border-brand-green focus:outline-none"
            />
            <button
               type="button"
               onClick={commit}
               disabled={!nameDraft.trim()}
               className="shrink-0 cursor-pointer rounded-xs px-2 py-1 text-xs font-semibold text-brand-green hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
               완료
            </button>
         </div>
      );
   }

   return (
      <button
         type="button"
         onClick={startEditing}
         className="flex h-fit cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
         <Plus size={16} />
         팀 추가
      </button>
   );
}
