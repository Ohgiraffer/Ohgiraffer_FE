'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getConsultationDetail,
   saveCounselorNote,
   type ConsultationDetail,
} from '@/services/counseling.service';

type Props = {
   detail: ConsultationDetail;
   onSaved: (updated: ConsultationDetail) => void;
};

// 담당 운영진 본인 전용 - 상담 기록 작성/수정. 기록이 없으면 바로 작성 모드로 시작하고,
// 저장하면 백엔드가 AI 상담 요약까지 함께 내려줘서 읽기 전용 화면으로 전환된다
export default function CounselorNoteSection({ detail, onSaved }: Props) {
   const hasNote = Boolean(detail.counselorNote);
   const [isEditing, setIsEditing] = useState(!hasNote);
   const [draft, setDraft] = useState(detail.counselorNote ?? '');
   const [isSaving, setIsSaving] = useState(false);

   const startEdit = () => {
      setDraft(detail.counselorNote ?? '');
      setIsEditing(true);
   };

   const handleSave = async () => {
      if (isSaving || !draft.trim()) return;
      setIsSaving(true);
      try {
         const result = await saveCounselorNote(detail.consultationId, {
            counselorNote: draft.trim(),
         });
         // 저장 응답엔 성공 여부만 오고 실제 메모·AI 요약 내용은 없어서, 최신 상세를 다시 조회한다
         const refreshed = await getConsultationDetail(detail.consultationId);
         onSaved(refreshed);
         setIsEditing(false);
         // AI 요약 생성은 실패해도 메모 자체는 저장된 상태(200 OK)라 error가 아니라 warning으로 알린다
         if (result.aiBriefGenerated) {
            toast.success(result.message);
         } else {
            toast.warning(result.message);
         }
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '상담 기록 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="mt-5">
         <p className="text-sm font-semibold text-[#374151]">상담 기록</p>
         {isEditing ? (
            <textarea
               value={draft}
               onChange={(event) => setDraft(event.target.value)}
               placeholder="상담 내용을 기록해주세요"
               rows={6}
               className="mt-2 w-full resize-none rounded-xs border border-[#E5E7EB] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         ) : (
            <p className="mt-2 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-sm whitespace-pre-line text-gray-700">
               {detail.counselorNote}
            </p>
         )}

         {!isEditing && detail.aiBrief && (
            <div className="mt-5">
               <p className="flex items-center gap-1.5 text-sm font-semibold text-[#374151]">
                  <Sparkles size={15} className="text-brand-gold" />
                  AI 상담 요약
               </p>
               <p className="mt-2 rounded-xs border border-brand-gold/40 bg-brand-cream/40 p-3 text-sm whitespace-pre-line text-gray-700">
                  {detail.aiBrief}
               </p>
            </div>
         )}

         <div className="mt-5 flex justify-end border-t border-[#F3F4F6] pt-4">
            {isEditing ? (
               <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !draft.trim()}
                  className={`rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors ${
                     isSaving || !draft.trim()
                        ? 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                        : 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                  }`}
               >
                  {isSaving ? '저장 중' : '저장'}
               </button>
            ) : (
               <button
                  type="button"
                  onClick={startEdit}
                  className="cursor-pointer rounded-sm border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
               >
                  수정
               </button>
            )}
         </div>
      </div>
   );
}
