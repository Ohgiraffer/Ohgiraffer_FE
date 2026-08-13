'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { setUnsavedChangesChecker } from '@/lib/navigationGuard';
import { createSubmissionBox, updateSubmissionBox } from '@/services/submissionBox.service';
import { toDateInputValue } from '../../formatSubmissionDate';
import type {
   LatePolicy,
   SubmissionBoxItemSpec,
   SubmissionItemType,
   TargetScope,
} from '../../types';

interface ItemDraft {
   draftId: string;
   submissionBoxItemId: number | null;
   name: string;
   type: SubmissionItemType;
   hint: string;
   required: boolean;
}

export interface EditableBox {
   submissionBoxId: number;
   projectName: string;
   targetScope: TargetScope;
   startAt: string;
   dueAt: string;
   latePolicy: LatePolicy;
   items: SubmissionBoxItemSpec[];
}

interface BoxCreateFormProps {
   editTarget?: EditableBox;
   onCancel: () => void;
   onSaved: () => void;
}

function createId() {
   return crypto.randomUUID();
}

// 항목명 / 파일 업로드 / 외부 링크 / 삭제 버튼 컬럼 너비 비율.
// 각 항목 행과 그 아래 힌트 입력란이 항상 같은 그리드를 써야 세로로 열이 어긋나지 않는다
const ITEM_GRID_COLUMNS =
   'grid-cols-1 sm:grid-cols-[24px_minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_28px]';

function ToggleButton({
   selected,
   onClick,
   children,
   className,
}: {
   selected: boolean;
   onClick: () => void;
   children: React.ReactNode;
   className?: string;
}) {
   return (
      <button
         type="button"
         onClick={onClick}
         className={cn(
            'w-full cursor-pointer rounded-xs border px-4 py-2.5 text-sm font-medium transition-colors',
            selected
               ? 'border-brand-green bg-[#EAF3EC] text-brand-green'
               : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
            className,
         )}
      >
         {children}
      </button>
   );
}

export default function BoxCreateForm({ editTarget, onCancel, onSaved }: BoxCreateFormProps) {
   const isEditing = !!editTarget;
   const projectNameId = useId();
   const startAtId = useId();
   const dueAtId = useId();

   const [projectName, setProjectName] = useState(editTarget?.projectName ?? '');
   const [targetScope, setTargetScope] = useState<TargetScope>(
      editTarget?.targetScope ?? 'TEAM',
   );
   const [startAt, setStartAt] = useState(toDateInputValue(editTarget?.startAt));
   const [dueAt, setDueAt] = useState(toDateInputValue(editTarget?.dueAt));
   const [latePolicy, setLatePolicy] = useState<LatePolicy>(editTarget?.latePolicy ?? 'BLOCK');
   const [items, setItems] = useState<ItemDraft[]>(
      editTarget
         ? editTarget.items.map((item) => ({
              draftId: createId(),
              submissionBoxItemId: item.submissionBoxItemId,
              name: item.itemName,
              type: item.itemType,
              hint: item.allowedFileTypes ?? '',
              required: item.required,
           }))
         : [
              {
                 draftId: createId(),
                 submissionBoxItemId: null,
                 name: '',
                 type: 'FILE',
                 hint: '',
                 required: true,
              },
           ],
   );
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const isSubmittingRef = useRef(false);

   // 항목 배열에서 비교에 필요한 필드만 뽑아 순서에 안정적인 스냅샷 문자열로 만든다(draftId는
   // 세션마다 랜덤이라 비교 대상에서 뺀다)
   const toItemsSnapshot = (list: ItemDraft[]) =>
      JSON.stringify(
         list.map((item) => ({
            submissionBoxItemId: item.submissionBoxItemId,
            name: item.name,
            type: item.type,
            hint: item.hint,
            required: item.required,
         })),
      );

   // 최초 값(신규면 빈 값, 수정이면 editTarget) 대비 변경 여부 - 팀 관리(ManagerTeamBoard)와
   // 동일한 방식으로 이탈 방지에 사용한다. state로 두는 이유는 렌더 중에 ref.current를 읽으면 안
   // 되기 때문 - 초기값은 이 컴포넌트의 최초 렌더에서 한 번만 계산되면 되므로 lazy state로 충분하다
   const [initialSnapshot] = useState({
      projectName,
      targetScope,
      startAt,
      dueAt,
      latePolicy,
      itemsSnapshot: toItemsSnapshot(items),
   });
   const itemsSnapshot = toItemsSnapshot(items);
   const isDirty =
      projectName !== initialSnapshot.projectName ||
      targetScope !== initialSnapshot.targetScope ||
      startAt !== initialSnapshot.startAt ||
      dueAt !== initialSnapshot.dueAt ||
      latePolicy !== initialSnapshot.latePolicy ||
      itemsSnapshot !== initialSnapshot.itemsSnapshot;

   // 사이드바 등 앱 내 이동은 navigationGuard로, 새로고침/탭 닫기는 beforeunload로 막는다(팀 관리와 동일)
   useEffect(() => {
      setUnsavedChangesChecker(() => isDirty);
      return () => setUnsavedChangesChecker(null);
   }, [isDirty]);

   useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         if (!isDirty) return;
         e.preventDefault();
         e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [isDirty]);

   // 저장 안 한 변경사항이 있는 채로 나가려는 시도(취소 버튼, 브라우저 뒤로가기)를 공통으로 가드한다.
   // dirty가 아니면 바로 실행하고, dirty면 실행을 보류해뒀다가 확인 모달에서 승인해야 실행한다
   const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
   const pendingActionRef = useRef<(() => void) | null>(null);

   const guardedAction = (fn: () => void) => {
      if (!isDirty) {
         fn();
         return;
      }
      pendingActionRef.current = fn;
      setIsLeaveConfirmOpen(true);
   };

   const handleConfirmLeave = () => {
      setIsLeaveConfirmOpen(false);
      const fn = pendingActionRef.current;
      pendingActionRef.current = null;
      fn?.();
   };

   const handleCancelLeave = () => {
      setIsLeaveConfirmOpen(false);
      pendingActionRef.current = null;
   };

   // 브라우저 뒤로가기 대응: dirty 상태로 들어가는 시점에 같은 주소로 더미 히스토리를 하나 쌓아둔다.
   // 뒤로가기를 누르면 popstate가 뜨는데, 그때 다시 더미를 쌓아 실제 이동을 취소하고 확인을 받는다
   const guardPushedRef = useRef(false);

   useEffect(() => {
      if (isDirty && !guardPushedRef.current) {
         window.history.pushState(null, '', window.location.href);
         guardPushedRef.current = true;
      } else if (!isDirty) {
         guardPushedRef.current = false;
      }
   }, [isDirty]);

   useEffect(() => {
      const handlePopState = () => {
         if (!isDirty) return;
         window.history.pushState(null, '', window.location.href);
         guardedAction(() => {
            guardPushedRef.current = false;
            window.history.go(-2);
         });
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isDirty]);

   const canSubmit =
      projectName.trim().length > 0 &&
      startAt.length > 0 &&
      dueAt.length > 0 &&
      items.length > 0 &&
      items.every((item) => item.name.trim().length > 0);

   const addItem = () => {
      setItems((prev) => [
         ...prev,
         {
            draftId: createId(),
            submissionBoxItemId: null,
            name: '',
            type: 'FILE',
            hint: '',
            required: true,
         },
      ]);
   };

   const removeItem = (draftId: string) => {
      setItems((prev) => prev.filter((item) => item.draftId !== draftId));
   };

   const updateItem = (draftId: string, patch: Partial<ItemDraft>) => {
      setItems((prev) =>
         prev.map((item) => (item.draftId === draftId ? { ...item, ...patch } : item)),
      );
   };

   const handleSubmitClick = () => {
      if (!canSubmit) return;
      setIsConfirmOpen(true);
   };

   const handleConfirmSave = async () => {
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      const body = {
         projectName: projectName.trim(),
         targetScope,
         startAt: `${startAt}T00:00:00`,
         dueAt: `${dueAt}T23:59:00`,
         latePolicy,
         items: items.map((item) => ({
            submissionBoxItemId: item.submissionBoxItemId,
            itemName: item.name.trim(),
            itemType: item.type,
            allowedFileTypes: item.type === 'FILE' ? item.hint.trim() || null : null,
            required: item.required,
         })),
      };

      try {
         if (isEditing) {
            await updateSubmissionBox(editTarget.submissionBoxId, body);
            toast.success('제출함을 수정했습니다.');
         } else {
            await createSubmissionBox(body);
            toast.success('제출함을 생성했습니다.');
         }
         setIsConfirmOpen(false);
         onSaved();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSubmittingRef.current = false;
      }
   };

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
         <h2 className="text-sm font-bold text-gray-900">
            {isEditing ? '제출함 수정' : '새 제출함 생성'}
         </h2>

         <div className="mt-5 grid grid-cols-2 gap-6">
            <div>
               <label
                  htmlFor={projectNameId}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-900"
               >
                  프로젝트명 <span className="font-bold text-brand-gold">*</span>
               </label>
               <input
                  id={projectNameId}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="예: 팀 최종 발표자료"
                  className="mt-2 h-10 w-full rounded-sm border border-[#E5E7EB] px-4 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green"
               />
            </div>
            <div>
               <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  제출 단위 <span className="font-bold text-brand-gold">*</span>
               </label>
               <div className="mt-2 flex gap-2">
                  <ToggleButton
                     className="flex-1"
                     selected={targetScope === 'INDIVIDUAL'}
                     onClick={() => setTargetScope('INDIVIDUAL')}
                  >
                     개인 제출
                  </ToggleButton>
                  <ToggleButton
                     className="flex-1"
                     selected={targetScope === 'TEAM'}
                     onClick={() => setTargetScope('TEAM')}
                  >
                     팀 제출
                  </ToggleButton>
               </div>
               {targetScope === 'TEAM' && (
                  <p className="mt-1.5 text-xs text-gray-400">
                     팀원 누구나 제출할 수 있고, 한 명이 제출하면 해당 팀 전체가 제출완료로 처리됩니다
                  </p>
               )}
            </div>

            <div>
               <label
                  htmlFor={startAtId}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-900"
               >
                  제출 시작일 <span className="font-bold text-brand-gold">*</span>
               </label>
               <DatePicker id={startAtId} value={startAt} onChange={setStartAt} className="mt-2" />
            </div>
            <div>
               <label
                  htmlFor={dueAtId}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-900"
               >
                  제출 마감일 <span className="font-bold text-brand-gold">*</span>
               </label>
               <DatePicker id={dueAtId} value={dueAt} onChange={setDueAt} className="mt-2" />
            </div>
         </div>

         <div className="mt-5">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               지각 제출 정책 <span className="font-bold text-brand-gold">*</span>
            </label>
            <div className="mt-2 flex gap-6">
               <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                     type="radio"
                     name="latePolicy"
                     checked={latePolicy === 'BLOCK'}
                     onChange={() => setLatePolicy('BLOCK')}
                     className="h-4 w-4 accent-brand-green"
                  />
                  마감 후 완전 차단
               </label>
               <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                     type="radio"
                     name="latePolicy"
                     checked={latePolicy === 'ALLOW'}
                     onChange={() => setLatePolicy('ALLOW')}
                     className="h-4 w-4 accent-brand-green"
                  />
                  지각 제출 허용
               </label>
            </div>
         </div>

         <div className="mt-5">
            <div className="flex items-center justify-between">
               <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                  제출 항목 <span className="font-bold text-brand-gold">*</span>
               </span>
               <span className="text-xs text-gray-400">최소 1개 필수</span>
            </div>

            <div className="mt-2 flex flex-col gap-3">
               {items.map((item, index) => (
                  <div key={item.draftId} className="rounded-xs border border-gray-200 p-3">
                     <div className={cn('grid items-start gap-3 sm:items-center', ITEM_GRID_COLUMNS)}>
                        <div className="flex items-center gap-3 sm:contents">
                           <span className="shrink-0 text-sm text-gray-400 sm:order-1">
                              {index + 1}
                           </span>
                           <label htmlFor={`item-name-${item.draftId}`} className="sr-only">
                              항목 {index + 1} 이름
                           </label>
                           <input
                              id={`item-name-${item.draftId}`}
                              value={item.name}
                              onChange={(e) => updateItem(item.draftId, { name: e.target.value })}
                              placeholder="항목명 (예: 발표자료)"
                              className="h-10 min-w-0 flex-1 rounded-sm border border-[#E5E7EB] px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green sm:order-2 sm:w-full"
                           />
                           <button
                              type="button"
                              onClick={() => removeItem(item.draftId)}
                              disabled={items.length === 1}
                              aria-label="항목 삭제"
                              className="shrink-0 cursor-pointer rounded-xs p-1.5 text-gray-400 hover:bg-gray-50 hover:text-brand-maroon disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 sm:order-5"
                           >
                              <X size={16} />
                           </button>
                        </div>
                        <div className="flex gap-2 sm:contents">
                           <ToggleButton
                              className="flex-1 sm:order-3 sm:flex-none"
                              selected={item.type === 'FILE'}
                              onClick={() => updateItem(item.draftId, { type: 'FILE' })}
                           >
                              파일 업로드
                           </ToggleButton>
                           <ToggleButton
                              className="flex-1 sm:order-4 sm:flex-none"
                              selected={item.type === 'LINK'}
                              onClick={() => updateItem(item.draftId, { type: 'LINK' })}
                           >
                              외부 링크
                           </ToggleButton>
                        </div>
                     </div>
                     <div className={cn('mt-2 grid gap-3', ITEM_GRID_COLUMNS)}>
                        <span className="hidden sm:block" />
                        <div className="min-w-0 sm:col-span-3">
                           {item.type === 'FILE' ? (
                              <input
                                 value={item.hint}
                                 onChange={(e) =>
                                    updateItem(item.draftId, { hint: e.target.value })
                                 }
                                 placeholder="허용 확장자 (예: pdf, pptx)"
                                 className="h-9 w-full rounded-sm border border-[#E5E7EB] px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green"
                              />
                           ) : (
                              <p className="text-xs text-gray-400">
                                 → 훈련생이 URL을 직접 입력합니다
                              </p>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <button
               type="button"
               onClick={addItem}
               className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-dashed border-gray-300 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
               <Plus size={16} />
               항목 추가
            </button>
         </div>

         <div className="mt-6 flex justify-end gap-2">
            <button
               type="button"
               onClick={() => guardedAction(onCancel)}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               취소
            </button>
            <button
               type="button"
               onClick={handleSubmitClick}
               disabled={!canSubmit}
               className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               {isEditing ? '수정' : '생성'}
            </button>
         </div>

         <ConfirmModal
            open={isConfirmOpen}
            title={isEditing ? '제출함을 수정하시겠습니까?' : '제출함을 생성하시겠습니까?'}
            description={
               isEditing
                  ? '수정 내용은 훈련생에게 즉시 반영됩니다.'
                  : '제출함을 생성하시면 훈련생에게 즉시 노출됩니다.'
            }
            confirmLabel="확인"
            onConfirm={handleConfirmSave}
            onClose={() => setIsConfirmOpen(false)}
         />

         <ConfirmModal
            open={isLeaveConfirmOpen}
            title="저장하지 않은 변경사항이 있습니다"
            description="지금 나가면 변경사항이 저장되지 않습니다. 그래도 나가시겠습니까?"
            confirmLabel="나가기"
            variant="danger"
            onConfirm={handleConfirmLeave}
            onClose={handleCancelLeave}
         />
      </div>
   );
}
