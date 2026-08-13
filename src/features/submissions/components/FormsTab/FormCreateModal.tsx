'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { setUnsavedChangesChecker } from '@/lib/navigationGuard';
import { createSurveyForm } from '@/services/surveyForm.service';

interface FormCreateModalProps {
   onClose: () => void;
   onCreated: (editUrl?: string) => void;
}

export default function FormCreateModal({ onClose, onCreated }: FormCreateModalProps) {
   const [title, setTitle] = useState('');
   const [dueAt, setDueAt] = useState('');
   const [titleError, setTitleError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const isDirty = title.trim().length > 0 || dueAt.length > 0;

   // 이 모달이 열려 있는 동안은 제출함 생성(BoxCreateForm)과 같은 전역 체커를 공유한다 -
   // SubmissionsPageClient의 탭 전환 가드(hasUnsavedChanges)가 이 값을 그대로 참조한다
   useEffect(() => {
      setUnsavedChangesChecker(() => isDirty);
      return () => setUnsavedChangesChecker(null);
   }, [isDirty]);

   const canSubmit = title.trim().length > 0 && dueAt.length > 0 && !isSubmitting;

   const handleSubmit = async () => {
      if (!canSubmit) return;
      setIsSubmitting(true);
      setTitleError('');
      // 생성 API 호출(await) 이후에 window.open을 부르면 사용자 제스처가 끊겨 팝업이 차단되므로,
      // 클릭 이벤트 안에서 빈 탭을 먼저 열어두고 생성이 끝나면 주소만 채운다.
      // 'noopener'를 넘기면 탭 핸들을 아예 못 받으므로(항상 null), 대신 연 뒤 opener를 직접 끊는다
      const editTab = window.open();
      if (editTab) editTab.opener = null;
      try {
         const result = await createSurveyForm({
            title: title.trim(),
            dueAt: `${dueAt}T23:59:00`,
         });
         toast.success('설문/평가 폼을 생성했습니다.');
         if (editTab && !editTab.closed) {
            editTab.location.href = result.editUrl;
            onCreated();
         } else {
            onCreated(result.editUrl);
         }
      } catch (err) {
         editTab?.close();
         if (err instanceof ApiError && err.status === 400) {
            setTitleError(err.errors.title ?? '');
            if (!err.errors.title) toast.error(err.message);
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Modal
         onClose={onClose}
         ariaLabel="설문/평가 폼 생성"
         panelClassName="w-full max-w-md"
         closeOnBackdropClick={false}
      >
         <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">설문/평가 폼 생성</h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         <div className="mt-5">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               폼 제목 <span className="font-bold text-brand-gold">*</span>
            </label>
            <input
               value={title}
               onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError('');
               }}
               placeholder="예: 7월 동료 평가"
               className="mt-2 h-10 w-full rounded-sm border border-[#E5E7EB] px-4 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
            {titleError && <p className="mt-1.5 text-xs text-red-600">{titleError}</p>}
         </div>

         <div className="mt-4">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               응답 마감일 <span className="font-bold text-brand-gold">*</span>
            </label>
            <DatePicker value={dueAt} onChange={setDueAt} className="mt-2" />
            <p className="mt-1.5 text-xs text-gray-400">마감일이 지나면 자동으로 응답이 마감됩니다</p>
         </div>

         <div className="mt-4 flex items-start gap-2 rounded-xs bg-[#FFF9EC] px-4 py-3 text-xs text-gray-700">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-[#B08A2E]" />
            <div>
               <p>생성된 폼은 Google Forms에서 문항을 구성합니다.</p>
               <p>주민등록번호, 계좌번호, 비밀번호 등 민감한 개인정보를 수집하는 문항은 넣지 마세요.</p>
            </div>
         </div>

         <div className="mt-6 flex justify-end gap-2">
            <button
               type="button"
               onClick={handleSubmit}
               disabled={!canSubmit}
               className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               {isSubmitting ? '생성 중...' : '생성'}
            </button>
         </div>
      </Modal>
   );
}
