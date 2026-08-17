'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Editor } from '@tiptap/react';
import { ChevronLeft } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   createNotice,
   getNoticeCategories,
   getNoticeDetail,
   updateNotice,
   type NoticeCategory,
   type NoticeDetail,
} from '@/services/notice.service';
import AiSentenceImprovePanel from './AiSentenceImprovePanel';
import NoticeContentPanel from './NoticeContentPanel';
import NoticeSettingsPanel from './NoticeSettingsPanel';
import { useAiSentenceImprove } from '../../hooks/useAiSentenceImprove';
import { useNoticeWriteForm } from '../../hooks/useNoticeWriteForm';
import { parseNoticeId } from '../../parseNoticeId';

const NoticeEditorArea = dynamic(() => import('./NoticeEditorArea'), {
   ssr: false,
   loading: () => <NoticeEditorAreaSkeleton />,
});

function NoticeEditorAreaSkeleton() {
   return (
      <div>
         <div className="flex items-center gap-3 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-1.5">
            <Skeleton width={140} height={28} className="rounded-xs" />
            <Skeleton width={100} height={28} className="rounded-xs" />
         </div>
         <div className="px-6 py-5">
            <Skeleton width="100%" height={375} className="rounded-md" />
         </div>
      </div>
   );
}

function escapeHtml(text: string) {
   return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function plainTextToHtml(text: string) {
   return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('');
}

type Props = {
   noticeId?: string;
};

// 작성/수정 화면 진입점
export default function NoticeWriteClient({ noticeId }: Props) {
   const router = useRouter();
   const numericNoticeId = parseNoticeId(noticeId);
   const isEditMode = Boolean(noticeId);
   const isInvalidNoticeId = isEditMode && numericNoticeId === undefined;

   const {
      data: categories = [],
      isLoading: isLoadingCategories,
      error: categoriesError,
   } = useQuery({
      queryKey: ['noticeCategories'],
      queryFn: getNoticeCategories,
   });

   useEffect(() => {
      if (categoriesError) {
         toast.error(
            categoriesError instanceof ApiError
               ? categoriesError.message
               : '카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   }, [categoriesError]);

   const [initialNotice, setInitialNotice] = useState<NoticeDetail | null>(null);
   const [isLoadingNotice, setIsLoadingNotice] = useState(isEditMode && !isInvalidNoticeId);
   const [hasNoticeError, setHasNoticeError] = useState(false);

   useEffect(() => {
      if (!isEditMode || isInvalidNoticeId || numericNoticeId === undefined) return;
      let isMounted = true;

      getNoticeDetail(numericNoticeId)
         .then((data) => {
            if (isMounted) setInitialNotice(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.code === 'NOTICE_001') {
               toast.error(err.message);
               router.replace('/notices');
               return;
            }
            setHasNoticeError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingNotice(false);
         });

      return () => {
         isMounted = false;
      };
   }, [isEditMode, isInvalidNoticeId, numericNoticeId, router]);

   if (isEditMode && isLoadingNotice) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/notices"
               className="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         </div>
      );
   }

   if (isEditMode && (hasNoticeError || !initialNotice)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/notices"
               className="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">공지사항을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <NoticeWriteForm
         noticeId={numericNoticeId}
         initialNotice={initialNotice ?? undefined}
         categories={categories}
         isLoadingCategories={isLoadingCategories}
      />
   );
}

type FormProps = {
   noticeId?: number;
   initialNotice?: NoticeDetail;
   categories: NoticeCategory[];
   isLoadingCategories: boolean;
};

// 좌측(제목+본문 편집기) / 우측(카테고리·공개설정 등) 패널, 등록/취소 버튼 조립
function NoticeWriteForm({ noticeId, initialNotice, categories, isLoadingCategories }: FormProps) {
   const router = useRouter();
   const isEditMode = Boolean(noticeId);
   const form = useNoticeWriteForm(noticeId, initialNotice);
   const [editor, setEditor] = useState<Editor | null>(null);
   const {
      isImproving,
      suggestions,
      improvedFullText,
      improve,
      close: closeImproveSuggestions,
      copySuggestion,
   } = useAiSentenceImprove();
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   // isSubmitting(state)만으로는 연타를 못 막는다 - state 반영 전(같은 tick)에 두 번째 클릭이
   // 새어나갈 수 있어서 그 사이에도 항상 최신값인 ref로 먼저 막는다
   const isSubmittingRef = useRef(false);

   // 수정 모드는 실질적인 변경이 있어야 저장 가능
   const canSave = isEditMode ? form.isSubmitEnabled && form.hasChanges : form.isSubmitEnabled;

   const handleRegisterClick = () => {
      if (!canSave) return;
      setIsConfirmOpen(true);
   };

   const handleConfirmRegister = async () => {
      if (isSubmittingRef.current || form.category === '') return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
         if (isEditMode && noticeId) {
            await updateNotice(noticeId, {
               categoryId: form.category,
               title: form.title,
               content: form.contentHtml,
               pinned: form.isRequired,
               visibleToTrainee: form.visibility === 'public',
            });

            const attachmentsOk = await form.commitAttachmentChanges();
            setIsConfirmOpen(false);
            if (!attachmentsOk) {
               toast.warning('공지사항 내용은 수정했습니다. 첨부파일은 다시 저장해주세요.');
               return;
            }

            toast.success('공지사항을 수정했습니다.');
            router.push(`/notices/${noticeId}`);
            return;
         }

         const created = await createNotice({
            categoryId: form.category,
            title: form.title,
            content: form.contentHtml,
            pinned: form.isRequired,
            visibleToTrainee: form.visibility === 'public',
            attachments: form.pendingAttachments,
         });
         toast.success('공지사항을 등록했습니다.');
         setIsConfirmOpen(false);
         router.push(`/notices/${created.noticeId}`);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : isEditMode
                 ? '공지 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                 : '공지 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

   const handleImproveClick = () => {
      if (!editor) return;
      improve(editor.getText());
   };

   // 전체 적용 - 개선된 텍스트로 본문을 통째로 교체
   const handleApplyAllSuggestions = (text: string) => {
      if (!editor) return;
      editor.commands.setContent(plainTextToHtml(text));
      closeImproveSuggestions();
      toast.success('전체 문장 적용이 완료되었습니다.');
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '공지 수정' : '공지 작성'}
         </h1>

         <div className="flex flex-col items-stretch gap-5 lg:flex-row">
            <div className="flex min-w-0 flex-1 flex-col">
               <NoticeContentPanel title={form.title} onTitleChange={form.setTitle}>
                  <NoticeEditorArea
                     initialContentHtml={initialNotice?.content}
                     onContentChange={form.setContent}
                     isImproving={isImproving}
                     onImproveClick={handleImproveClick}
                     onEditorReady={setEditor}
                  />
               </NoticeContentPanel>

               {suggestions.length > 0 && (
                  <AiSentenceImprovePanel
                     suggestions={suggestions}
                     improvedFullText={improvedFullText}
                     onCopySuggestion={copySuggestion}
                     onApplyAll={handleApplyAllSuggestions}
                     onClose={closeImproveSuggestions}
                  />
               )}
            </div>
            <NoticeSettingsPanel
               category={form.category}
               onCategoryChange={form.setCategory}
               categoryOptions={categories}
               isLoadingCategories={isLoadingCategories}
               isRequired={form.isRequired}
               onRequiredChange={form.setIsRequired}
               visibility={form.visibility}
               onVisibilityChange={form.setVisibility}
               isEditMode={isEditMode}
               existingAttachments={form.existingAttachments}
               pendingDeleteIds={form.pendingDeleteIds}
               onRemoveExisting={form.removeExistingAttachment}
               onUndoRemoveExisting={form.undoRemoveExistingAttachment}
               pendingNewFiles={form.pendingNewFiles}
               onPendingNewFileRemove={form.removePendingNewFile}
               pendingAttachments={form.pendingAttachments}
               isUploadingFiles={form.isUploadingFiles}
               onFilesAdd={form.addFiles}
               onFileRemove={form.removeFile}
            />
         </div>

         <div className="mt-5 flex justify-end gap-2">
            <button
               type="button"
               onClick={() =>
                  router.push(isEditMode && noticeId ? `/notices/${noticeId}` : '/notices')
               }
               className="cursor-pointer rounded-xs border border-[#E5E7EB] bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
               취소
            </button>
            <button
               type="button"
               disabled={!canSave}
               onClick={handleRegisterClick}
               className={`rounded-xs px-6 py-2.5 text-sm font-semibold ${
                  canSave
                     ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               {isEditMode ? '저장' : '등록'}
            </button>
         </div>

         <ConfirmModal
            open={isConfirmOpen}
            title={isEditMode ? '공지사항을 수정하시겠습니까?' : '공지사항을 등록하시겠습니까?'}
            description={
               isEditMode
                  ? '수정한 내용으로 공지사항이 즉시 업데이트됩니다.'
                  : '등록 즉시 설정한 공개 대상에게 공개됩니다.'
            }
            confirmLabel={isSubmitting ? '처리 중' : '확인'}
            busy={isSubmitting}
            onConfirm={handleConfirmRegister}
            onClose={() => setIsConfirmOpen(false)}
         />
      </div>
   );
}
