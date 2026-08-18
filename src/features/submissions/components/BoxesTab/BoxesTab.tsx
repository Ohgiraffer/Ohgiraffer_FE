'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import {
   deleteSubmissionBox,
   getSubmissionBoxes,
   getSubmissionBoxSubmissions,
} from '@/services/submissionBox.service';
import type { EditableBox } from './BoxCreateForm';
import BoxListTable from './BoxListTable';
import type { SubmissionBoxListItem } from '../../types';

// BoxListTable 데스크톱 테이블과 동일한 컬럼 구조의 자리표시 (모바일 카드는 P1 관례상 별도 스켈레톤을 두지 않는다)
function BoxesTableSkeleton({ hideManage }: { hideManage: boolean }) {
   return (
      <table className="w-full table-fixed text-left text-sm">
         <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
               <th className="w-[4%] px-6 py-3 font-medium">#</th>
               <th className="w-[22%] px-6 py-3 font-medium text-center">프로젝트명</th>
               <th className="w-[13%] px-6 py-3 font-medium text-center">시작일</th>
               <th className="w-[13%] px-6 py-3 font-medium text-center">마감일</th>
               <th className="w-[22%] px-6 py-3 font-medium text-center">제출 현황</th>
               <th className="w-[11%] px-6 py-3 font-medium text-center">지각 제출</th>
               {!hideManage && (
                  <th className="w-[15%] px-6 py-3 font-medium text-center">관리</th>
               )}
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
                     <Skeleton width="70%" height={14} className="mx-auto rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width={64} height={14} className="mx-auto rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width={64} height={14} className="mx-auto rounded-md" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width="60%" height={10} className="mx-auto rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                     <Skeleton width={56} height={22} className="mx-auto rounded-xs" />
                  </td>
                  {!hideManage && (
                     <td className="px-6 py-4">
                        <Skeleton width={80} height={28} className="mx-auto rounded-xs" />
                     </td>
                  )}
               </tr>
            ))}
         </tbody>
      </table>
   );
}

// 생성/수정 버튼을 눌러야만 필요한 날짜선택 폼이라 지연 로딩한다
const BoxCreateForm = dynamic(() => import('./BoxCreateForm'), {
   ssr: false,
   loading: () => (
      <div className="mb-4 rounded-sm border border-[#E5E7EB] bg-white p-6">
         <Skeleton width="40%" height={20} className="rounded-md" />
         <Skeleton width="100%" height={160} className="mt-4 rounded-md" />
      </div>
   ),
});

function sortByDueAt(boxes: SubmissionBoxListItem[]) {
   return [...boxes].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

interface BoxesTabProps {
   isCreating: boolean;
   onCreatingChange: (value: boolean) => void;
   // submissions/page.tsx가 서버에서 미리 불러와 넘겨주는 초기 목록 - 없으면 지금처럼
   // 클라이언트에서 직접 불러온다
   initialBoxes?: SubmissionBoxListItem[];
}

export default function BoxesTab({ isCreating, onCreatingChange, initialBoxes }: BoxesTabProps) {
   const [boxes, setBoxes] = useState<SubmissionBoxListItem[]>(() =>
      initialBoxes ? sortByDueAt(initialBoxes) : [],
   );
   const [isLoading, setIsLoading] = useState(!initialBoxes);
   const [hasError, setHasError] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');
   const [reloadKey, setReloadKey] = useState(0);
   const [editTarget, setEditTarget] = useState<EditableBox | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<SubmissionBoxListItem | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   // 서버가 이미 initialBoxes를 넘겨줬으면, 마운트 시점의 첫 조회 한 번은 건너뛴다
   const skipInitialFetchRef = useRef(initialBoxes != null);

   useEffect(() => {
      if (skipInitialFetchRef.current) {
         skipInitialFetchRef.current = false;
         return;
      }
      let isMounted = true;
      getSubmissionBoxes()
         .then((result) => {
            if (isMounted) setBoxes(sortByDueAt(result));
         })
         .catch((err) => {
            if (!isMounted) return;
            setErrorMessage(
               err instanceof ApiError ? err.message : '제출함 목록을 불러오지 못했습니다.',
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

   const handleSaved = () => {
      onCreatingChange(false);
      setEditTarget(null);
      refetch();
   };

   const handleEditClick = async (box: SubmissionBoxListItem) => {
      onCreatingChange(false);
      try {
         // 항목(items)의 실제 ID까지 필요해서 상세 조회(제출 현황) API로 다시 받아옴
         const detail = await getSubmissionBoxSubmissions(box.submissionBoxId, { size: 1 });
         setEditTarget({
            submissionBoxId: detail.submissionBoxId,
            projectName: detail.projectName,
            targetScope: detail.targetScope,
            startAt: detail.startAt,
            dueAt: detail.dueAt,
            latePolicy: detail.latePolicy,
            items: detail.items,
         });
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '제출함 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   const handleDelete = async () => {
      if (!deleteTarget || isDeleting) return;
      setIsDeleting(true);
      try {
         await deleteSubmissionBox(deleteTarget.submissionBoxId);
         toast.success('제출함을 삭제했습니다.');
         setDeleteTarget(null);
         refetch();
      } catch (err) {
         if (err instanceof ApiError && err.code === 'SUBMISSION_002') {
            toast.error('이미 제출물이 존재하여 삭제할 수 없습니다.');
         } else if (err instanceof ApiError && err.code === 'SUBMISSION_001') {
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
         {isCreating && (
            <div className="mb-4">
               <BoxCreateForm onCancel={() => onCreatingChange(false)} onSaved={handleSaved} />
            </div>
         )}

         {editTarget && (
            <div className="mb-4">
               <BoxCreateForm
                  editTarget={editTarget}
                  onCancel={() => setEditTarget(null)}
                  onSaved={handleSaved}
               />
            </div>
         )}

         {isLoading ? (
            <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
               <BoxesTableSkeleton hideManage={isCreating} />
            </div>
         ) : hasError ? (
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">
                  {errorMessage || '제출함 목록을 불러오지 못했습니다.'}
               </p>
               <button
                  type="button"
                  onClick={refetch}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : boxes.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">생성된 제출함이 없습니다</p>
         ) : (
            <BoxListTable
               boxes={boxes}
               onEdit={handleEditClick}
               onDelete={setDeleteTarget}
               hideManage={isCreating}
            />
         )}

         <ConfirmModal
            open={!!deleteTarget}
            title="제출함을 삭제할까요?"
            description="삭제하면 훈련생의 제출 내역도 함께 사라지며 복구할 수 없습니다."
            variant="danger"
            confirmLabel="삭제"
            busy={isDeleting}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
         />
      </div>
   );
}
