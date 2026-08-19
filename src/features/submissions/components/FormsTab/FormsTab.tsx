'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AnimatedHeight from '@/components/ui/loading/AnimatedHeight';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import {
   deleteSurveyForm,
   getSurveyFormDetail,
   getSurveyForms,
} from '@/services/surveyForm.service';
import FormListTable from './FormListTable';
import type { SurveyFormDetail, SurveyFormListItem } from '../../types';

// FormListTable 데스크톱 테이블과 동일한 컬럼 구조의 자리표시 (모바일 카드는 P1 관례상 별도 스켈레톤을 두지 않는다)
function FormsTableSkeleton() {
   return (
      <table className="w-full table-fixed text-left text-sm">
         <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
               <th className="w-[8%] px-6 py-3 font-medium">#</th>
               <th className="w-[26%] px-6 py-3 font-medium">폼 제목</th>
               <th className="w-[12%] px-6 py-3 font-medium text-center">상태</th>
               <th className="w-[16%] px-6 py-3 font-medium text-center">응답 마감일</th>
               <th className="w-[20%] px-6 py-3 font-medium text-center">응답 현황</th>
               <th className="w-[18%] px-6 py-3 font-medium text-center">관리</th>
            </tr>
         </thead>
         <tbody>
            {[0, 1, 2, 3].map((i) => (
               <tr
                  key={i}
                  className="border-b border-[#F3F4F6] last:border-b-0"
                  style={{ '--row-delay': `${i * 0.15}s` } as React.CSSProperties}
               >
                  <td className="px-6 py-4">
                     <Skeleton width={16} height={14} className="rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width="70%" height={14} className="rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width={56} height={22} className="mx-auto rounded-xs" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width={72} height={14} className="mx-auto rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width="60%" height={10} className="mx-auto rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width={80} height={28} className="mx-auto rounded-xs" />
                  </td>
               </tr>
            ))}
         </tbody>
      </table>
   );
}

// 모달 코드 자체가 로딩되는 동안 배경 클릭을 막고 자리표시자를 보여준다(Modal.tsx의 배경 스타일과 동일)
function FormModalSkeleton() {
   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
         <div className="w-full max-w-md rounded-sm bg-white p-6">
            <Skeleton width="50%" height={20} className="rounded-md" />
            <Skeleton width="100%" height={40} className="mt-4 rounded-xs" />
            <Skeleton width="100%" height={40} className="mt-3 rounded-xs" />
         </div>
      </div>
   );
}

// 생성/수정 버튼을 눌러야만 필요한 날짜선택 모달이라 지연 로딩한다
const FormCreateModal = dynamic(() => import('./FormCreateModal'), {
   ssr: false,
   loading: FormModalSkeleton,
});
const FormEditModal = dynamic(() => import('./FormEditModal'), {
   ssr: false,
   loading: FormModalSkeleton,
});

interface FormsTabProps {
   isCreating: boolean;
   onCreatingChange: (value: boolean) => void;
   // submissions/page.tsx가 서버에서 미리 불러와 넘겨주는 초기 목록 - 없으면 지금처럼
   // 클라이언트에서 직접 불러온다
   initialForms?: SurveyFormListItem[];
}

export default function FormsTab({ isCreating, onCreatingChange, initialForms }: FormsTabProps) {
   const [forms, setForms] = useState<SurveyFormListItem[]>(initialForms ?? []);
   const [isLoading, setIsLoading] = useState(!initialForms);
   const [hasError, setHasError] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');
   const [reloadKey, setReloadKey] = useState(0);
   const [editTarget, setEditTarget] = useState<SurveyFormDetail | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<SurveyFormListItem | null>(null);
   const [pendingEditUrl, setPendingEditUrl] = useState<string | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   // 서버가 이미 initialForms를 넘겨줬으면, 마운트 시점의 첫 조회 한 번은 건너뛴다
   const skipInitialFetchRef = useRef(initialForms != null);

   useEffect(() => {
      if (skipInitialFetchRef.current) {
         skipInitialFetchRef.current = false;
         return;
      }
      let isMounted = true;
      getSurveyForms()
         .then((result) => {
            if (isMounted) setForms(result);
         })
         .catch((err) => {
            if (!isMounted) return;
            setErrorMessage(
               err instanceof ApiError && err.code === 'FORM_003'
                  ? 'Google Forms API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
                  : err instanceof ApiError
                    ? err.message
                    : '설문/평가 폼 목록을 불러오지 못했습니다.',
            );
            setHasError(true);
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
      setErrorMessage('');
      setReloadKey((key) => key + 1);
   };

   const handleCreated = (editUrl?: string) => {
      onCreatingChange(false);
      refetch();
      // 저장 완료 콜백은 비동기 이후에 실행돼 사용자 제스처가 끊겨 있으므로 window.open을 다시 시도하지 않는다
      // (모달이 클릭 시점에 이미 탭을 열었고, 실패했을 때만 editUrl을 넘겨준다)
      if (editUrl) setPendingEditUrl(editUrl);
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

   const handleSaved = (editUrl?: string) => {
      setEditTarget(null);
      refetch();
      // 저장 완료 콜백은 비동기 이후에 실행돼 사용자 제스처가 끊겨 있으므로 window.open을 다시 시도하지 않는다
      // (모달이 클릭 시점에 이미 탭을 열었고, 실패했을 때만 editUrl을 넘겨준다)
      if (editUrl) setPendingEditUrl(editUrl);
   };

   const handleDelete = async () => {
      if (!deleteTarget || isDeleting) return;
      setIsDeleting(true);
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
         setIsDeleting(false);
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

         {/* 결재 처리 탭(ApprovalProcessingList)과 동일한 구조 - 테두리 카드를 AnimatedHeight
            바깥에 하나만 두고, 안쪽 상태(로딩/에러/빈/목록)는 이 카드를 갈아끼우지 않고 내용물만
            바뀐다. 상태마다 따로 카드를 두면(예전 구조) 전환될 때마다 카드 자체가 통째로
            사라졌다 다시 생겨서, 하나의 카드가 부드럽게 늘었다 줄었다 하는 것처럼 안 보였다 */}
         <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <AnimatedHeight
               transitionKey={
                  isLoading
                     ? 'loading'
                     : hasError
                       ? 'error'
                       : forms.length === 0
                         ? 'empty'
                         : 'content'
               }
            >
               {isLoading ? (
                  <FormsTableSkeleton />
               ) : hasError ? (
                  <div className="flex flex-col items-center gap-3 px-6 py-16">
                     <p className="text-sm text-gray-400">
                        {errorMessage || '설문/평가 폼 목록을 불러오지 못했습니다.'}
                     </p>
                     <button
                        type="button"
                        onClick={refetch}
                        className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                        다시 시도
                     </button>
                  </div>
               ) : forms.length === 0 ? (
                  <p className="px-6 py-10 text-center text-gray-400">생성된 폼이 없습니다</p>
               ) : (
                  <FormListTable
                     forms={forms}
                     onEdit={handleEditClick}
                     onDelete={setDeleteTarget}
                  />
               )}
            </AnimatedHeight>
         </div>

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
            description="응답이 없는 폼만 삭제할 수 있으며, 삭제하면 복구할 수 없습니다."
            variant="danger"
            confirmLabel="삭제"
            busy={isDeleting}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
         />
      </div>
   );
}
