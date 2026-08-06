'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import NoticeContentPanel from './NoticeContentPanel';
import NoticeSettingsPanel from './NoticeSettingsPanel';
import { useNoticeWriteForm } from '../../hooks/useNoticeWriteForm';
import { MOCK_NOTICE_CATEGORIES, MOCK_NOTICES } from '../../mockData';

const CATEGORY_OPTIONS = MOCK_NOTICE_CATEGORIES.map((category) => category.name);

type Props = {
   // 주어지면 수정 모드 - 해당 id의 공지를 찾아 폼을 프리필함
   noticeId?: string;
};

// 좌측(제목+본문 편집기) / 우측(카테고리·공개설정 등) 패널과 등록/취소 버튼을 조립하는 페이지 컴포넌트
// 작성/수정 화면을 겸함 - noticeId가 있으면 기존 공지 내용을 불러와 수정 모드로 동작
export default function NoticeWriteClient({ noticeId }: Props) {
   const router = useRouter();
   const [initialNotice] = useState(() =>
      noticeId ? MOCK_NOTICES.find((notice) => notice.id === noticeId) : undefined,
   );
   const isEditMode = Boolean(noticeId);
   const form = useNoticeWriteForm(initialNotice);
   const [isConfirmOpen, setIsConfirmOpen] = useState(false);

   const handleRegisterClick = () => {
      if (!form.isSubmitEnabled) return;
      setIsConfirmOpen(true);
   };

   const handleConfirmRegister = () => {
      setIsConfirmOpen(false);
      if (isEditMode && noticeId) {
         // TODO: 백엔드 준비되면 실제 공지 수정 API 연동
         router.push(`/notices/${noticeId}`);
      } else {
         // TODO: 백엔드 준비되면 실제 공지 등록 API 연동
         router.push('/notices');
      }
   };

   if (noticeId && !initialNotice) {
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
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? '공지 수정' : '공지 작성'}
         </h1>

         <div className="mt-5 flex items-stretch gap-5">
            <NoticeContentPanel
               title={form.title}
               onTitleChange={form.setTitle}
               initialContentHtml={initialNotice?.contentHtml}
               onContentChange={form.setContent}
            />
            <NoticeSettingsPanel
               category={form.category}
               onCategoryChange={form.setCategory}
               categoryOptions={CATEGORY_OPTIONS}
               isRequired={form.isRequired}
               onRequiredChange={form.setIsRequired}
               visibility={form.visibility}
               onVisibilityChange={form.setVisibility}
               existingAttachments={form.existingAttachments}
               onRemoveExisting={form.removeExistingAttachment}
               files={form.files}
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
               disabled={!form.isSubmitEnabled}
               onClick={handleRegisterClick}
               className={`rounded-xs px-6 py-2.5 text-sm font-semibold  ${
                  form.isSubmitEnabled
                     ? 'cursor-pointer text-white bg-brand-green hover:bg-[#4D655A]'
                     : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               {isEditMode ? '수정 완료' : '등록'}
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
            onConfirm={handleConfirmRegister}
            onClose={() => setIsConfirmOpen(false)}
         />
      </div>
   );
}
