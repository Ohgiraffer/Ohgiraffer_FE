'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Pencil, Pin, Sparkles, Trash2, User, CalendarDays } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import NoticeAttachmentList from './NoticeAttachmentList';
import { MOCK_NOTICES } from '../../mockData';
import type { NoticeEntry } from '../../types';

type Props = {
   noticeId: string;
};

// 공지사항 상세 조회 페이지 - 뒤로가기 + 카드(배지/제목/본문/첨부파일) + AI 일정추출 배너 조립
export default function NoticeDetailClient({ noticeId }: Props) {
   const router = useRouter();
   const [notice, setNotice] = useState<NoticeEntry | undefined>(() =>
      MOCK_NOTICES.find((item) => item.id === noticeId),
   );
   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

   const toggleConfirmStatus = () => {
      if (!notice) return;
      const willBeComplete = notice.confirmStatus !== '완료';
      // 본인 확인 처리를 확인자 수(confirmedCount)에도 +1/-1로 반영하는 mock
      setNotice({
         ...notice,
         confirmStatus: willBeComplete ? '완료' : '미완료',
         confirmedCount: notice.confirmedCount + (willBeComplete ? 1 : -1),
      });
   };

   const handleDelete = () => {
      // TODO: 백엔드 준비되면 실제 공지 삭제 API 연동
      setIsDeleteConfirmOpen(false);
      router.push('/notices');
   };

   if (!notice) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="mx-auto w-full max-w-4xl">
               <Link
                  href="/notices"
                  className="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
               >
                  <ChevronLeft size={16} />
                  목록으로
               </Link>
               <p className="mt-10 text-center text-sm text-gray-400">
                  공지사항을 찾을 수 없습니다.
               </p>
            </div>
         </div>
      );
   }

   const isComplete = notice.confirmStatus === '완료';

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         {/* 화면이 넓어도 카드 너비는 이 안에서 고정되고, 화면이 좁아지면 max-w보다 먼저 w-full이 줄어듦 */}
         <div className="mx-auto w-full max-w-4xl">
            <Link
               href="/notices"
               className="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>

            <div className="mt-4 rounded-sm border border-[#E5E7EB] bg-white">
               <div className="px-8 pt-6 mb-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        {notice.isPinned && (
                           <span className="flex items-center gap-1 rounded-xs bg-brand-maroon px-2 py-1 text-xs font-semibold text-white">
                              <Pin size={12} />
                              고정
                           </span>
                        )}
                        <span className="rounded-xs bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                           {notice.category}
                        </span>
                     </div>
                     <div className="flex items-center text-sm">
                        <Link
                           href={`/notices/${noticeId}/edit`}
                           className="flex cursor-pointer items-center gap-1 rounded-xs px-2 py-1 text-[#6B7280] hover:bg-[#E5E7EB]"
                        >
                           <Pencil size={14} />
                           수정
                        </Link>
                        <button
                           type="button"
                           onClick={() => setIsDeleteConfirmOpen(true)}
                           className="flex cursor-pointer items-center gap-1 text-brand-maroon hover:bg-[#E5E7EB] px-2 py-1 rounded-xs"
                        >
                           <Trash2 size={14} />
                           삭제
                        </button>
                     </div>
                  </div>

                  <h1 className="mt-3 text-2xl font-bold text-gray-900">{notice.title}</h1>

                  <div className="mt-2 flex  items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex gap-2  items-center">
                           <User size={15} />
                           {notice.author}
                        </span>
                        <span>·</span>
                        <span className="flex gap-2  items-center">
                           <CalendarDays size={15} />
                           {notice.createdAt}
                        </span>
                     </div>
                     <label className="flex cursor-pointer items-center gap-2 rounded-xs font-semibold border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                        <input
                           type="checkbox"
                           checked={isComplete}
                           onChange={toggleConfirmStatus}
                           className="h-4 w-4 cursor-pointer rounded-xs accent-brand-green"
                        />
                        ({notice.confirmedCount}명)
                     </label>
                  </div>
               </div>

               <div className="mx-8 border-t border-[#E5E7EB]" />

               <div
                  className="notice-editor-content px-8 py-6 text-sm"
                  dangerouslySetInnerHTML={{ __html: notice.contentHtml }}
               />

               <NoticeAttachmentList attachments={notice.attachments} />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-sm bg-brand-cream px-6 py-3">
               <div className="flex items-center gap-3 text-sm font-semibold text-gray-900">
                  <Sparkles size={16} className="text-brand-green" />
                  AI가 공지사항에 포함된 일정을 추출해줘요{' '}
                  <span className="font-medium text-[#6B7280]">- 일정을 등록하시겠습니까? </span>
               </div>
               <button
                  type="button"
                  disabled
                  // TODO: AI 일정 추출 기능 백엔드 준비되면 연동
                  className="cursor-pointer rounded-sm bg-brand-green px-4 py-2 text-sm text-white hover:bg-[#4D655A]"
               >
                  등록하기
               </button>
            </div>
         </div>

         <ConfirmModal
            open={isDeleteConfirmOpen}
            title="공지를 삭제할까요?"
            description="삭제하면 되돌릴 수 없습니다."
            confirmLabel="삭제"
            variant="danger"
            onConfirm={handleDelete}
            onClose={() => setIsDeleteConfirmOpen(false)}
         />
      </div>
   );
}
