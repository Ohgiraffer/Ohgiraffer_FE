'use client';

import { useRef, useState } from 'react';
import { Building, Plus, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SidePanelShell, { PanelHeaderBar } from '@/components/ui/SidePanelShell';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';

export type SpaceManageRow = {
   id: number;
   name: string;
   capacity: number;
   occupantCount: number;
   canDelete: boolean;
};

type Props = {
   open: boolean;
   onClose: () => void;
   spaces: SpaceManageRow[];
   onAddSpace: (name: string, capacity: number) => Promise<void>;
   onRemoveSpace: (spaceId: number) => Promise<void>;
};

// 공간 예약 우측 관리 패널 - 새 공간 추가 + 기존 공간 삭제
export default function SpaceManagePanel({
   open,
   onClose,
   spaces,
   onAddSpace,
   onRemoveSpace,
}: Props) {
   const [name, setName] = useState('');
   const [capacity, setCapacity] = useState('');
   const [nameError, setNameError] = useState('');
   const [capacityError, setCapacityError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const isSubmittingRef = useRef(false);
   const [deleteTarget, setDeleteTarget] = useState<SpaceManageRow | null>(null);
   const [isDeleting, setIsDeleting] = useState(false);
   const isDeletingRef = useRef(false);

   const trimmedName = name.trim();
   const parsedCapacity = Number(capacity);
   // 공간 이름과 수용 인원 둘 다 입력해야 추가 가능
   const isAddEnabled =
      trimmedName.length > 0 && capacity.trim().length > 0 && parsedCapacity > 0 && !isSubmitting;

   const handleAdd = async () => {
      if (!isAddEnabled || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setNameError('');
      setCapacityError('');
      try {
         await onAddSpace(trimmedName, parsedCapacity);
         setName('');
         setCapacity('');
      } catch (err) {
         if (err instanceof ApiError && err.status === 400) {
            setNameError(err.errors.spaceName ?? '');
            setCapacityError(err.errors.capacity ?? '');
            if (!err.errors.spaceName && !err.errors.capacity) toast.error(err.message);
         } else if (err instanceof ApiError && err.code === 'SPACE_002') {
            setNameError(err.message);
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '공간 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

   const handleConfirmDelete = async () => {
      if (!deleteTarget || isDeletingRef.current) return;
      const target = deleteTarget;
      isDeletingRef.current = true;
      setIsDeleting(true);
      try {
         await onRemoveSpace(target.id);
         setDeleteTarget(null);
      } catch (err) {
         setDeleteTarget(null);
         toast.error(
            err instanceof ApiError && err.code === 'SPACE_003'
               ? '현재 이용자가 있어 삭제할 수 없습니다.'
               : err instanceof ApiError
                 ? err.message
                 : '공간 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isDeletingRef.current = false;
         setIsDeleting(false);
      }
   };

   return (
      <>
         <SidePanelShell open={open} onClose={onClose} labelledBy="space-manage-panel-title">
            <PanelHeaderBar titleId="space-manage-panel-title" onClose={onClose}>
               <Building size={18} />
               공간 관리
            </PanelHeaderBar>

            <div className="flex-1 overflow-y-auto">
               <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4">
                  <div>
                     <label
                        htmlFor="space-manage-name"
                        className="text-[15px] font-semibold text-gray-900"
                     >
                        새 공간 추가
                        <span className="font-bold text-[16px] text-brand-gold">*</span>
                     </label>
                     <input
                        id="space-manage-name"
                        type="text"
                        value={name}
                        onChange={(event) => {
                           setName(event.target.value);
                           if (nameError) setNameError('');
                        }}
                        disabled={isSubmitting}
                        placeholder="공간 이름을 입력하세요"
                        className="mt-1.5 w-full rounded-xs border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:bg-gray-50 disabled:text-gray-400"
                     />
                     {nameError && <p className="mt-1.5 text-xs text-red-600">{nameError}</p>}
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                     <span className="shrink-0 text-sm font-medium text-gray-700">수용 인원</span>
                     <input
                        type="number"
                        min={1}
                        value={capacity}
                        onChange={(event) => {
                           setCapacity(event.target.value);
                           if (capacityError) setCapacityError('');
                        }}
                        disabled={isSubmitting}
                        className="w-30 rounded-xs border border-[#E5E7EB] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:bg-gray-50 disabled:text-gray-400"
                     />
                     <span className="shrink-0 text-sm text-gray-500">명</span>
                     <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!isAddEnabled}
                        className={`ml-auto flex shrink-0 items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold ${
                           isAddEnabled
                              ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                              : 'cursor-not-allowed bg-[#E5E7EB] text-gray-400'
                        }`}
                     >
                        <Plus size={14} />
                        {isSubmitting ? '등록 중...' : '추가'}
                     </button>
                  </div>
                  {capacityError && <p className="mt-1.5 text-xs text-red-600">{capacityError}</p>}
               </div>

               {spaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-gray-400">
                     <Building size={32} />
                     <p className="text-sm">등록된 공간이 없습니다</p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-2 px-6 py-4">
                     {spaces.map((space) => (
                        <div
                           key={space.id}
                           className="flex items-center justify-between gap-2 rounded-sm border border-[#E5E7EB] px-4 py-3"
                        >
                           <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-gray-500">
                                 <Building size={16} />
                              </span>
                              <div>
                                 <p className="text-sm font-semibold text-gray-900">{space.name}</p>
                                 <p className="text-xs text-gray-400">
                                    수용 {space.capacity}명 · {space.occupantCount}명 재실
                                 </p>
                              </div>
                           </div>
                           <button
                              type="button"
                              disabled={!space.canDelete}
                              onClick={() => setDeleteTarget(space)}
                              aria-label={`${space.name} 삭제`}
                              className={`shrink-0 rounded-sm p-2 ${
                                 space.canDelete
                                    ? 'cursor-pointer text-brand-maroon hover:bg-gray-50'
                                    : 'cursor-not-allowed text-gray-300'
                              }`}
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </SidePanelShell>

         <ConfirmModal
            open={deleteTarget !== null}
            title={`[${deleteTarget?.name}] 공간을 삭제하겠습니까?`}
            description="삭제하면 되돌릴 수 없습니다."
            variant="danger"
            confirmLabel={isDeleting ? '삭제 중...' : '확인'}
            busy={isDeleting}
            onConfirm={handleConfirmDelete}
            onClose={() => setDeleteTarget(null)}
         />
      </>
   );
}
