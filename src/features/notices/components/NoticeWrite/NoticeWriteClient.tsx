'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
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
import { useNoticeEditor } from '../../hooks/useNoticeEditor';
import { useNoticeWriteForm } from '../../hooks/useNoticeWriteForm';
import { parseNoticeId } from '../../parseNoticeId';

function escapeHtml(text: string) {
   return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// AI가 돌려준 건 서식 없는 순수 텍스트라, 줄바꿈만 문단으로 살려서 에디터에 다시 넣는다
function plainTextToHtml(text: string) {
   return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join('');
}

type Props = {
   // 주어지면 수정 모드 - 해당 id의 공지를 실제 상세 조회 API로 불러와 폼을 프리필함
   noticeId?: string;
};

// 작성/수정 화면 진입점 - 수정 모드면 실제 GET /notices/{id}로 기존 공지를 먼저 불러온다.
// useNoticeWriteForm은 마운트 시점의 초기값으로만 상태를 채우는 훅이라, 데이터가 도착하기 전에는
// 폼(NoticeWriteForm)을 아예 그리지 않고 로딩 화면만 보여준다 - 도착한 뒤에야 그 값으로 마운트됨
export default function NoticeWriteClient({ noticeId }: Props) {
   const router = useRouter();
   const numericNoticeId = parseNoticeId(noticeId);
   const isEditMode = Boolean(noticeId);
   // noticeId가 양의 정수 문자열이 아니면(예: 잘못된 주소로 직접 진입) 조회 자체를 시도할 수 없는
   // 상태 - 초기 state 값에서부터 이 경우를 반영해두면 effect가 "불러오는 중..."에서 못 빠져나오지 않는다
   const isInvalidNoticeId = isEditMode && numericNoticeId === undefined;

   const [categories, setCategories] = useState<NoticeCategory[]>([]);
   const [isLoadingCategories, setIsLoadingCategories] = useState(true);

   const [initialNotice, setInitialNotice] = useState<NoticeDetail | null>(null);
   const [isLoadingNotice, setIsLoadingNotice] = useState(isEditMode && !isInvalidNoticeId);
   const [hasNoticeError, setHasNoticeError] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getNoticeCategories()
         .then((data) => {
            if (isMounted) setCategories(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoadingCategories(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   useEffect(() => {
      // isInvalidNoticeId가 false인데도 numericNoticeId가 undefined일 수는 없지만, TS는 그
      // 관계를 모르므로 narrowing을 위해 명시적으로 한 번 더 확인한다
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

// 좌측(제목+본문 편집기) / 우측(카테고리·공개설정 등) 패널과 등록/취소 버튼을 조립.
// initialNotice가 이미 준비된 상태로만 마운트되므로, useNoticeWriteForm의 초기값이 항상 최신 데이터로 채워짐
function NoticeWriteForm({ noticeId, initialNotice, categories, isLoadingCategories }: FormProps) {
   const router = useRouter();
   const isEditMode = Boolean(noticeId);
   const form = useNoticeWriteForm(noticeId, initialNotice);
   // 에디터 인스턴스를 여기서 만드는 이유는 useNoticeEditor 주석 참고 - [AI 문장 개선] 제안 패널이
   // 고정 높이인 NoticeContentPanel 카드 밖(전체 너비)에 그려져야 해서 getText/setContent에
   // 이 레벨에서도 접근할 수 있어야 한다
   const editor = useNoticeEditor(initialNotice?.content, form.setContent);
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

   // 수정 모드에서는 실질적인 변경(여백만 바뀐 건 제외)이 있어야만 저장 가능
   const canSave = isEditMode ? form.isSubmitEnabled && form.hasChanges : form.isSubmitEnabled;

   const handleRegisterClick = () => {
      if (!canSave) return;
      setIsConfirmOpen(true);
   };

   // [확인]을 눌렀을 때만 실제 등록/수정 API를 호출한다 - 모달이 뜨는 시점에는 아무 것도 호출하지 않음
   const handleConfirmRegister = async () => {
      if (isSubmitting || form.category === '') return;
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

            // 첨부파일 추가/삭제는 별도 API라 본문 수정과 별개로 성공/실패할 수 있다. 일부라도
            // 실패하면(예: 삭제하려던 파일이 이미 없어짐) 상세 페이지로 이동하지 않고 이 화면에
            // 남겨서 실패한 항목을 다시 저장해볼 수 있게 한다 - 그대로 나가면 재시도할 방법이 없음
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
         setIsSubmitting(false);
      }
   };

   // immediatelyRender: false 때문에 마운트 첫 틱에는 editor가 아직 없다(SSR/CSR 불일치 방지용) -
   // 그 사이엔 폼 자체를 그리지 않는다(곧바로 채워지는 짧은 순간이라 별도 로딩 UI 없이 넘어감)
   if (!editor) return null;

   const handleImproveClick = () => improve(editor.getText());

   // "전체 적용" - 개선된 텍스트로 본문을 통째로 교체한다(기존 굵게/기울임 등 서식은 사라짐).
   // setContent는 기본적으로 onUpdate를 그대로 발생시켜서 form.contentHtml도 자동으로 갱신된다
   const handleApplyAllSuggestions = (text: string) => {
      editor.commands.setContent(plainTextToHtml(text));
      closeImproveSuggestions();
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '공지 수정' : '공지 작성'}
         </h1>

         <div className="mt-5 flex items-stretch gap-5">
            <NoticeContentPanel
               title={form.title}
               onTitleChange={form.setTitle}
               editor={editor}
               isImproving={isImproving}
               onImproveClick={handleImproveClick}
            />
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

         {suggestions.length > 0 && (
            <div className="mt-5">
               <AiSentenceImprovePanel
                  suggestions={suggestions}
                  improvedFullText={improvedFullText}
                  onCopySuggestion={copySuggestion}
                  onApplyAll={handleApplyAllSuggestions}
                  onClose={closeImproveSuggestions}
               />
            </div>
         )}

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
            onConfirm={handleConfirmRegister}
            onClose={() => !isSubmitting && setIsConfirmOpen(false)}
         />
      </div>
   );
}
