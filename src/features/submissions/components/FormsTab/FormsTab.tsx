'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import {
   deleteSurveyForm,
   getSurveyFormDetail,
   getSurveyForms,
} from '@/services/surveyForm.service';
import FormCreateModal from './FormCreateModal';
import FormEditModal from './FormEditModal';
import FormListTable from './FormListTable';
import type { SurveyFormDetail, SurveyFormListItem } from '../../types';

interface FormsTabProps {
   isCreating: boolean;
   onCreatingChange: (value: boolean) => void;
}

export default function FormsTab({ isCreating, onCreatingChange }: FormsTabProps) {
   const [forms, setForms] = useState<SurveyFormListItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [reloadKey, setReloadKey] = useState(0);
   const [editTarget, setEditTarget] = useState<SurveyFormDetail | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<SurveyFormListItem | null>(null);
   const [pendingEditUrl, setPendingEditUrl] = useState<string | null>(null);
   const isDeletingRef = useRef(false);

   useEffect(() => {
      let isMounted = true;
      getSurveyForms()
         .then((result) => {
            if (isMounted) setForms(result);
         })
         .catch(() => {
            if (isMounted) setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [reloadKey]);

   const refetch = () => {
      setIsLoading(true);
      setHasError(false);
      setReloadKey((key) => key + 1);
   };

   const handleCreated = (editUrl: string) => {
      onCreatingChange(false);
      refetch();
      // 생성 직후 팝업 차단으로 새 탭이 안 열리면 수동으로 열 수 있는 배너를 남긴다
      const opened = window.open(editUrl, '_blank', 'noopener,noreferrer');
      if (!opened) setPendingEditUrl(editUrl);
   };

   const handleEditClick = async (form: SurveyFormListItem) => {
      try {
         const detail = await getSurveyFormDetail(form.surveyFormId);
         setEditTarget(detail);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '설문 폼 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   const handleSaved = () => {
      setEditTarget(null);
      refetch();
   };

   const handleDelete = async () => {
      if (!deleteTarget || isDeletingRef.current) return;
      isDeletingRef.current = true;
      try {
         await deleteSurveyForm(deleteTarget.surveyFormId);
         toast.success('설문/평가 폼을 삭제했습니다.');
         setDeleteTarget(null);
         refetch();
      } catch (err) {
         if (err instanceof ApiError && err.code === 'SURVEY_003') {
            toast.error('설문 응답이 존재하여 삭제할 수 없습니다.');
         } else if (err instanceof ApiError && err.code === 'SURVEY_001') {
            toast.error(err.message);
            setDeleteTarget(null);
            refetch();
            return;
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         isDeletingRef.current = false;
      }
   };

   return (
      <div>
         {pendingEditUrl && (
            <div className="mb-4 flex items-center justify-between rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-3 text-sm text-gray-700">
               <span>팝업이 차단되어 Google Form 편집 창이 자동으로 열리지 않았습니다.</span>
               <button
                  type="button"
                  onClick={() => {
                     window.open(pendingEditUrl, '_blank', 'noopener,noreferrer');
                     setPendingEditUrl(null);
                  }}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xs bg-brand-green px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4D655A]"
               >
                  <ExternalLink size={12} />
                  Google Form 열기
               </button>
            </div>
         )}

         {isLoading ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : hasError ? (
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">설문/평가 폼 목록을 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={refetch}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : forms.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">생성된 폼이 없습니다</p>
         ) : (
            <FormListTable forms={forms} onEdit={handleEditClick} onDelete={setDeleteTarget} />
         )}

         {isCreating && (
            <FormCreateModal onClose={() => onCreatingChange(false)} onCreated={handleCreated} />
         )}

         {editTarget && (
            <FormEditModal
               form={editTarget}
               onClose={() => setEditTarget(null)}
               onSaved={handleSaved}
            />
         )}

         <ConfirmModal
            open={!!deleteTarget}
            title="설문/평가 폼을 삭제할까요?"
            description="삭제하면 수집된 응답도 함께 사라지며 복구할 수 없습니다."
            variant="danger"
            confirmLabel="삭제"
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
         />
      </div>
   );
}
