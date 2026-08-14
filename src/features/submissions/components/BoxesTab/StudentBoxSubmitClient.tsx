'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileText, TriangleAlert, Upload, Users } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import {
   getSubmissionBoxDetailForStudent,
   submitMyBox,
   updateMySubmission,
   type SubmitItemInput,
} from '@/services/submissionBox.service';
import { formatDateTime, formatDday } from '../../formatSubmissionDate';
import type { SubmissionBoxDetailForStudent, SubmissionBoxItemSpec } from '../../types';

interface StudentBoxSubmitClientProps {
   boxId: string;
}

interface DraftValue {
   // 이번 세션에서 새로 고른 파일 - 아직 업로드 전
   file?: File;
   // 서버에 이미 제출된 파일명 - 표시만 하고 다시 보내지 않음(교체 전까지)
   existingFileName?: string;
   externalUrl?: string;
}

function isValidExternalUrl(value: string) {
   try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
   } catch {
      return false;
   }
}

function getErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

export default function StudentBoxSubmitClient({ boxId }: StudentBoxSubmitClientProps) {
   const submissionBoxId = Number(boxId);

   const [detail, setDetail] = useState<SubmissionBoxDetailForStudent | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   const [values, setValues] = useState<Record<number, DraftValue>>({});
   const [touchedItems, setTouchedItems] = useState<Set<number>>(new Set());
   const [urlTouched, setUrlTouched] = useState<Record<number, boolean>>({});
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const items = detail?.items ?? [];
   const mySubmission = detail?.submissions.find((entry) => entry.mine);
   const isEditing = detail?.mySubmissionId != null;

   useEffect(() => {
      if (!Number.isInteger(submissionBoxId)) return;
      let isMounted = true;
      getSubmissionBoxDetailForStudent(submissionBoxId)
         .then((result) => {
            if (!isMounted) return;
            setDetail(result);
            const mine = result.submissions.find((entry) => entry.mine);
            const nextValues: Record<number, DraftValue> = {};
            mine?.values.forEach((value) => {
               nextValues[value.submissionBoxItemId] = {
                  existingFileName: value.originalFileName ?? undefined,
                  externalUrl: value.externalUrl ?? undefined,
               };
            });
            setValues(nextValues);
            setTouchedItems(new Set());
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
   }, [submissionBoxId, retryKey]);

   const refetch = () => {
      setIsLoading(true);
      setHasError(false);
      setRetryKey((key) => key + 1);
   };

   const markTouched = (itemId: number) => {
      setTouchedItems((prev) => new Set(prev).add(itemId));
   };

   const handleFileSelect = (itemId: number, file: File | null) => {
      if (!file) return;
      setValues((prev) => ({ ...prev, [itemId]: { file } }));
      markTouched(itemId);
   };

   const handleClearFile = (itemId: number) => {
      setValues((prev) => ({ ...prev, [itemId]: {} }));
      markTouched(itemId);
   };

   const handleUrlChange = (itemId: number, value: string) => {
      setValues((prev) => ({ ...prev, [itemId]: { externalUrl: value } }));
      setUrlTouched((prev) => ({ ...prev, [itemId]: true }));
      markTouched(itemId);
   };

   const urlError = (item: SubmissionBoxItemSpec) => {
      if (item.itemType !== 'LINK') return '';
      const value = values[item.submissionBoxItemId!]?.externalUrl ?? '';
      if (!urlTouched[item.submissionBoxItemId!] || !value) return '';
      return isValidExternalUrl(value) ? '' : '외부 링크의 형식을 확인해주세요.';
   };

   const isItemFilled = (item: SubmissionBoxItemSpec) => {
      const value = values[item.submissionBoxItemId!];
      if (!value) return false;
      return item.itemType === 'FILE'
         ? !!value.file || !!value.existingFileName
         : !!value.externalUrl && isValidExternalUrl(value.externalUrl);
   };

   const filledCount = items.filter(isItemFilled).length;
   const canSubmit =
      items.length > 0 &&
      items.every((item) => item.required === false || isItemFilled(item)) &&
      !isSubmitting &&
      (!detail || detail.acceptingSubmissions);

   const handleSubmitClick = () => {
      if (!canSubmit) return;
      setIsConfirmOpen(true);
   };

   const buildPayload = (targetItems: SubmissionBoxItemSpec[]) => {
      const files: File[] = [];
      const payloadItems: SubmitItemInput[] = targetItems.map((item) => {
         const value = values[item.submissionBoxItemId!] ?? {};
         if (item.itemType === 'FILE' && value.file) {
            const fileIndex = files.length;
            files.push(value.file);
            return {
               submissionBoxItemId: item.submissionBoxItemId!,
               itemType: item.itemType,
               fileIndex,
               externalUrl: null,
            };
         }
         return {
            submissionBoxItemId: item.submissionBoxItemId!,
            itemType: item.itemType,
            fileIndex: null,
            externalUrl: item.itemType === 'LINK' ? value.externalUrl ?? null : null,
         };
      });
      return { payloadItems, files };
   };

   const handleConfirmSubmit = async () => {
      if (!detail || isSubmitting) return;
      setIsSubmitting(true);
      try {
         if (isEditing) {
            const changedItems = items.filter((item) => touchedItems.has(item.submissionBoxItemId!));
            if (changedItems.length === 0) {
               toast.info('변경된 항목이 없습니다.');
               setIsConfirmOpen(false);
               return;
            }
            const { payloadItems, files } = buildPayload(changedItems);
            await updateMySubmission(detail.mySubmissionId!, payloadItems, files);
            toast.success('제출물을 수정했습니다.');
         } else {
            const { payloadItems, files } = buildPayload(items);
            await submitMyBox(detail.submissionBoxId, payloadItems, files);
            toast.success('제출물을 제출했습니다.');
         }
         setIsConfirmOpen(false);
         refetch();
      } catch (err) {
         if (err instanceof ApiError && err.code === 'SUBMISSION_005') {
            toast.error('이미 제출된 항목입니다.');
            refetch();
         } else if (err instanceof ApiError && err.code === 'SUBMISSION_006') {
            toast.error('아직 제출 시작 전입니다.');
            refetch();
         } else if (err instanceof ApiError && err.code === 'SUBMISSION_007') {
            toast.error(isEditing ? '수정 가능 기간이 종료되었습니다.' : '마감 후 제출이 차단되었습니다.');
            refetch();
         } else if (err instanceof ApiError && err.code === 'SUBMISSION_009') {
            toast.error(getErrorMessage(err, '허용되지 않는 파일 확장자입니다.'));
         } else if (err instanceof ApiError && err.code === 'SUBMISSION_008') {
            toast.error('제출 항목이 변경되었습니다. 다시 확인해주세요.');
            refetch();
         } else if (err instanceof ApiError && err.code === 'SUBMISSION_010') {
            toast.error(getErrorMessage(err, '현재 소속된 팀을 찾을 수 없어 제출할 수 없습니다.'));
            refetch();
         } else if (err instanceof ApiError && (err.code === 'SUBMISSION_004' || err.code === 'SUBMISSION_011')) {
            toast.error(getErrorMessage(err, '제출물 정보를 찾을 수 없습니다.'));
            refetch();
         } else {
            toast.error(getErrorMessage(err, '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'));
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   if (!Number.isInteger(submissionBoxId)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/submissions"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">제출함을 찾을 수 없습니다.</p>
         </div>
      );
   }

   if (isLoading) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         </div>
      );
   }

   if (hasError || !detail) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/submissions"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">제출함을 찾을 수 없습니다.</p>
         </div>
      );
   }

   const isNotStarted = new Date() < new Date(detail.startAt);
   const isPastDue = new Date() > new Date(detail.dueAt);
   const isBlocked = !detail.acceptingSubmissions;

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link
            href={`/submissions/boxes/${detail.submissionBoxId}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            제출함 상세로
         </Link>

         <div className="mt-5 grid grid-cols-[1fr_1.4fr] gap-6">
            <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
               <h1 className="text-lg font-bold text-gray-900">{detail.projectName}</h1>
               <p className="mt-1 text-xs text-gray-400">
                  {detail.targetScope === 'TEAM' ? '팀 제출' : '개인 제출'} · 항목 {items.length}개
               </p>

               <div className="mt-4">
                  <p className="text-xs text-gray-400">제출 기간</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                     {formatDateTime(detail.startAt)} ~ {formatDateTime(detail.dueAt)}
                  </p>
               </div>

               <div className="mt-4">
                  <p className="text-xs text-gray-400">마감까지</p>
                  <p className={`mt-1 text-2xl font-bold ${isPastDue ? 'text-brand-maroon' : 'text-gray-900'}`}>
                     {formatDday(detail.dueAt)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{formatDateTime(detail.dueAt)}까지</p>
               </div>

               <div className="mt-5 flex flex-col gap-2">
                  <div className="flex items-start gap-2 rounded-xs bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                     <TriangleAlert size={14} className="mt-0.5 shrink-0 text-gray-400" />
                     마감 후에는 제출이 불가하니 기한 내 제출해주세요
                  </div>
                  {detail.targetScope === 'TEAM' && (
                     <div className="flex items-start gap-2 rounded-xs bg-[#FFF9EC] px-3 py-2.5 text-xs text-gray-700">
                        <Users size={14} className="mt-0.5 shrink-0 text-[#B08A2E]" />
                        제출 후 팀원 전체에게 알림이 발송됩니다
                     </div>
                  )}
                  {!isBlocked && detail.lateSubmission && (
                     <div className="flex items-start gap-2 rounded-xs bg-[#F5DFDC] px-3 py-2.5 text-xs text-brand-maroon">
                        <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                        지각 제출로 기록됩니다
                     </div>
                  )}
                  {isBlocked && (
                     <div className="flex items-start gap-2 rounded-xs bg-[#F5DFDC] px-3 py-2.5 text-xs text-brand-maroon">
                        <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                        {isNotStarted
                           ? `아직 제출 시작 전입니다. ${formatDateTime(detail.startAt)}부터 제출할 수 있습니다`
                           : '마감되어 더 이상 제출할 수 없습니다'}
                     </div>
                  )}
               </div>
            </div>

            <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">제출 항목</h2>
                  <div className="flex items-center gap-2">
                     {isEditing && (
                        <span className="rounded-xs bg-green-50 px-2 py-1 text-xs font-medium text-brand-green">
                           수정 가능
                        </span>
                     )}
                     <span className="text-xs text-gray-400">
                        {isEditing
                           ? `${formatDateTime(mySubmission?.submittedAt)} 제출`
                           : `${filledCount}/${items.length} 완료`}
                     </span>
                  </div>
               </div>

               <div className="mt-4 flex flex-col gap-4">
                  {items.map((item) => {
                     const value = values[item.submissionBoxItemId!] ?? {};
                     const filled = isItemFilled(item);
                     const error = urlError(item);
                     const displayFileName = value.file?.name ?? value.existingFileName;

                     return (
                        <div key={item.submissionBoxItemId}>
                           <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-sm text-gray-700">
                                 {item.itemName}
                                 {item.required ? (
                                    <span className="font-bold text-brand-gold">*</span>
                                 ) : (
                                    <span className="text-xs font-normal text-gray-400">(선택)</span>
                                 )}
                                 <span className="text-xs text-gray-400">
                                    {item.itemType === 'FILE' ? `파일 · ${item.allowedFileTypes}` : '외부 링크'}
                                 </span>
                              </span>
                              <span
                                 className={`text-xs ${filled ? 'text-brand-green' : 'text-gray-400'}`}
                              >
                                 {filled ? '입력됨' : '미입력'}
                              </span>
                           </div>

                           <div className="mt-2">
                              {item.itemType === 'FILE' ? (
                                 displayFileName ? (
                                    <div className="flex items-center justify-between rounded-sm border border-[#E5E7EB] px-3 py-2 text-sm">
                                       <span className="flex items-center gap-2 truncate text-gray-700">
                                          <FileText size={14} className="shrink-0 text-gray-400" />
                                          <span className="truncate">{displayFileName}</span>
                                       </span>
                                       <div className="flex shrink-0 items-center gap-2">
                                          <button
                                             type="button"
                                             onClick={() => handleClearFile(item.submissionBoxItemId!)}
                                             className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700"
                                          >
                                             {isEditing ? '교체' : '취소'}
                                          </button>
                                       </div>
                                    </div>
                                 ) : (
                                    <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50">
                                       <Upload size={14} className="shrink-0" />
                                       파일 선택...
                                       <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) =>
                                             handleFileSelect(
                                                item.submissionBoxItemId!,
                                                e.target.files?.[0] ?? null,
                                             )
                                          }
                                       />
                                    </label>
                                 )
                              ) : (
                                 <input
                                    value={value.externalUrl ?? ''}
                                    onChange={(e) =>
                                       handleUrlChange(item.submissionBoxItemId!, e.target.value)
                                    }
                                    placeholder="https://..."
                                    className={`h-10 w-full rounded-sm border px-3 text-sm text-gray-900 focus:outline-none focus:ring-1 ${
                                       error
                                          ? 'border-brand-maroon focus:ring-brand-maroon'
                                          : 'border-[#E5E7EB] focus:ring-brand-green'
                                    }`}
                                 />
                              )}
                              {error && <p className="mt-1.5 text-xs text-brand-maroon">{error}</p>}
                           </div>
                        </div>
                     );
                  })}
               </div>

               {!isBlocked && (
                  <button
                     type="button"
                     onClick={handleSubmitClick}
                     disabled={!canSubmit}
                     className="mt-6 w-full cursor-pointer rounded-sm bg-brand-green py-3 text-sm font-semibold text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                     {isSubmitting ? '처리 중...' : isEditing ? '수정 사항 저장' : '전체 제출하기'}
                  </button>
               )}
               {!canSubmit && !isBlocked && (
                  <p className="mt-2 text-center text-xs text-gray-400">
                     필수 항목을 모두 입력해야 {isEditing ? '저장할' : '제출할'} 수 있습니다
                  </p>
               )}
            </div>
         </div>

         <ConfirmModal
            open={isConfirmOpen}
            title={isEditing ? '수정 사항을 저장하시겠습니까?' : '제출물을 제출하시겠습니까?'}
            description={
               isEditing
                  ? '수정 사항을 저장하시면 기존 제출 내용이 변경됩니다.'
                  : '제출 후 마감 전까지 제출물 수정이 가능합니다. 제출이 완료된 경우, 팀원 전체에게 알림이 발송됩니다.'
            }
            confirmLabel="제출"
            busy={isSubmitting}
            onConfirm={handleConfirmSubmit}
            onClose={() => setIsConfirmOpen(false)}
         />
      </div>
   );
}
