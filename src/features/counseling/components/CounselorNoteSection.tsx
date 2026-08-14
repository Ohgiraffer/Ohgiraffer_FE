'use client';

import { useRef, useState } from 'react';
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

// 상담 기록 작성/수정
export default function CounselorNoteSection({ detail, onSaved }: Props) {
   const hasNote = Boolean(detail.counselorNote);
   const [isEditing, setIsEditing] = useState(!hasNote);
   const [draft, setDraft] = useState(detail.counselorNote ?? '');
   const [initialDraft, setInitialDraft] = useState(detail.counselorNote ?? '');
   const [isSaving, setIsSaving] = useState(false);
   
   const isSavingRef = useRef(false);

   const startEdit = () => {
      const value = detail.counselorNote ?? '';
      setDraft(value);
      setInitialDraft(value);
      setIsEditing(true);
   };

   const hasChanges = draft.trim() !== initialDraft.trim();
   const canSave = !isSaving && draft.trim().length > 0 && hasChanges;

   const handleSave = async () => {
      if (!canSave) return;
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);
      try {
         const result = await saveCounselorNote(detail.consultationId, {
            counselorNote: draft.trim(),
         });
         const refreshed = await getConsultationDetail(detail.consultationId);
         onSaved(refreshed);
         setIsEditing(false);
         
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
         isSavingRef.current = false;
         setIsSaving(false);
      }
   };

   return (
      <div className="mt-5">
         <p className="text-sm font-semibold text-[#374151]">상담 기록</p>
         <p className="text-[11px] text-brand-sage">
            작성 완료 시, 이 상담은 완료된 상담으로 처리됩니다.
         </p>
         {isEditing ? (
            <textarea
               value={draft}
               onChange={(event) => setDraft(event.target.value)}
               placeholder="상담 후 24시간까지 상담 기록 작성이 가능합니다."
               rows={6}
               disabled={isSaving}
               className="mt-2 w-full resize-none rounded-xs border border-[#E5E7EB] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
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
                  disabled={!canSave}
                  className={`rounded-sm px-5 py-2.5 text-sm font-semibold transition-colors ${
                     canSave
                        ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                        : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
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
