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
import NoticeContentPanel from './NoticeContentPanel';
import NoticeSettingsPanel from './NoticeSettingsPanel';
import { useNoticeWriteForm } from '../../hooks/useNoticeWriteForm';

type Props = {
   // 주어지면 수정 모드 - 해당 id의 공지를 실제 상세 조회 API로 불러와 폼을 프리필함
   noticeId?: string;
};

// 작성/수정 화면 진입점 - 수정 모드면 실제 GET /notices/{id}로 기존 공지를 먼저 불러온다.
// useNoticeWriteForm은 마운트 시점의 초기값으로만 상태를 채우는 훅이라, 데이터가 도착하기 전에는
// 폼(NoticeWriteForm)을 아예 그리지 않고 로딩 화면만 보여준다 - 도착한 뒤에야 그 값으로 마운트됨
export default function NoticeWriteClient({ noticeId }: Props) {
   const router = useRouter();
   const numericNoticeId = noticeId ? Number(noticeId) : undefined;
   const isEditMode = Boolean(noticeId);

   const [categories, setCategories] = useState<NoticeCategory[]>([]);
   const [isLoadingCategories, setIsLoadingCategories] = useState(true);

   const [initialNotice, setInitialNotice] = useState<NoticeDetail | null>(null);
   const [isLoadingNotice, setIsLoadingNotice] = useState(isEditMode);
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
      if (!isEditMode || !numericNoticeId) return;
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
   }, [isEditMode, numericNoticeId, router]);

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
            toast.success('공지사항을 수정했습니다.');
            setIsConfirmOpen(false);
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

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '공지 수정' : '공지 작성'}
         </h1>

         <div className="mt-5 flex items-stretch gap-5">
            <NoticeContentPanel
               title={form.title}
               onTitleChange={form.setTitle}
               initialContentHtml={initialNotice?.content}
               onContentChange={form.setContent}
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
               existingAttachments={form.existingAttachments}
               onRemoveExisting={form.removeExistingAttachment}
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
            onConfirm={handleConfirmRegister}
            onClose={() => !isSubmitting && setIsConfirmOpen(false)}
         />
      </div>
   );
}
