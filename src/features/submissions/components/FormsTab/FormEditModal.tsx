'use client';

import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/date-picker';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { updateSurveyForm } from '@/services/surveyForm.service';
import { toDateInputValue } from '../../formatSubmissionDate';
import type { SurveyFormDetail, SurveyFormStatus } from '../../types';

const STATUS_OPTIONS: Array<{ value: SurveyFormStatus; label: string }> = [
   { value: 'DRAFT', label: '임시저장' },
   { value: 'PUBLISHED', label: '발행됨' },
   { value: 'CLOSED', label: '마감됨' },
];

interface FormEditModalProps {
   form: SurveyFormDetail;
   onClose: () => void;
   onSaved: () => void;
}

export default function FormEditModal({ form, onClose, onSaved }: FormEditModalProps) {
   const [title, setTitle] = useState(form.title);
   const [dueAt, setDueAt] = useState(toDateInputValue(form.dueAt));
   const [status, setStatus] = useState<SurveyFormStatus>(form.status);
   const [titleError, setTitleError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const canSubmit = title.trim().length > 0 && dueAt.length > 0 && !isSubmitting;

   const handleSubmit = async () => {
      if (!canSubmit) return;
      setIsSubmitting(true);
      setTitleError('');
      const prevStatus = form.status;
      try {
         await updateSurveyForm(form.surveyFormId, {
            title: title.trim(),
            dueAt: `${dueAt}T23:59:00`,
            status,
         });
         toast.success('설문/평가 폼을 수정했습니다.');
         onSaved();
      } catch (err) {
         if (err instanceof ApiError && err.code === 'SURVEY_002') {
            setStatus(prevStatus);
            toast.error(err.message || '허용되지 않는 상태 변경입니다.');
         } else if (err instanceof ApiError && err.status === 400) {
            setTitleError(err.errors.title ?? '');
            if (!err.errors.title) toast.error(err.message);
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Modal
         onClose={onClose}
         ariaLabel="설문/평가 폼 수정"
         panelClassName="w-full max-w-md"
         closeOnBackdropClick={false}
      >
         <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">설문/평가 폼 수정</h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         <a
            href={form.editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1 text-sm text-brand-green hover:underline"
         >
            <ExternalLink size={14} />
            Google Form에서 문항 수정
         </a>

         <div className="mt-4">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               폼 제목 <span className="font-bold text-brand-gold">*</span>
            </label>
            <input
               value={title}
               onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError('');
               }}
               className="mt-2 h-10 w-full rounded-sm border border-[#E5E7EB] px-4 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
            {titleError && <p className="mt-1.5 text-xs text-red-600">{titleError}</p>}
         </div>

         <div className="mt-4">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               응답 마감일 <span className="font-bold text-brand-gold">*</span>
            </label>
            <DatePicker value={dueAt} onChange={setDueAt} className="mt-2" />
         </div>

         <div className="mt-4">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               상태 <span className="font-bold text-brand-gold">*</span>
            </label>
            <Select value={status} onValueChange={(value) => value && setStatus(value as SurveyFormStatus)}>
               <SelectTrigger className="mt-2 data-[size=default]:h-10 w-full rounded-sm">
                  <SelectValue placeholder="상태 선택">
                     {(value: SurveyFormStatus | null) =>
                        STATUS_OPTIONS.find((option) => option.value === value)?.label ?? '상태 선택'
                     }
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start">
                  {STATUS_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="mt-6 flex justify-end gap-2">
            <button
               type="button"
               onClick={onClose}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               취소
            </button>
            <button
               type="button"
               onClick={handleSubmit}
               disabled={!canSubmit}
               className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               {isSubmitting ? '수정 중...' : '수정'}
            </button>
         </div>
      </Modal>
   );
}
