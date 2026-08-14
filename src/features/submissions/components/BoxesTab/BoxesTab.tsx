'use client';

import { useEffect, useState } from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import {
   deleteSubmissionBox,
   getSubmissionBoxes,
   getSubmissionBoxSubmissions,
} from '@/services/submissionBox.service';
import BoxCreateForm, { type EditableBox } from './BoxCreateForm';
import BoxListTable from './BoxListTable';
import type { SubmissionBoxListItem } from '../../types';

interface BoxesTabProps {
   isCreating: boolean;
   onCreatingChange: (value: boolean) => void;
}

export default function BoxesTab({ isCreating, onCreatingChange }: BoxesTabProps) {
   const [boxes, setBoxes] = useState<SubmissionBoxListItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [errorMessage, setErrorMessage] = useState('');
   const [reloadKey, setReloadKey] = useState(0);
   const [editTarget, setEditTarget] = useState<EditableBox | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<SubmissionBoxListItem | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);

   useEffect(() => {
      let isMounted = true;
      getSubmissionBoxes()
         .then((result) => {
            if (isMounted) {
               setBoxes(
                  [...result].sort(
                     (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
                  ),
               );
            }
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
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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
