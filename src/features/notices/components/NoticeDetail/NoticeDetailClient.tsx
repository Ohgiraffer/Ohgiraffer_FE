'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Pencil, Pin, Sparkles, Trash2, User, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   confirmNotice,
   deleteNotice,
   getNoticeDetail,
   type NoticeDetail,
} from '@/services/notice.service';
import NoticeAttachmentList from './NoticeAttachmentList';

type Props = {
   noticeId: string;
};

// 공지사항 상세 조회 페이지 - 뒤로가기 + 카드(배지/제목/본문/첨부파일) + AI 일정추출 배너 조립
export default function NoticeDetailClient({ noticeId }: Props) {
   const router = useRouter();
   const numericNoticeId = Number(noticeId);

   const [notice, setNotice] = useState<NoticeDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);
   const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [isConfirming, setIsConfirming] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(numericNoticeId)) return;
      let isMounted = true;

      getNoticeDetail(numericNoticeId)
         .then((data) => {
            if (isMounted) setNotice(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.code === 'NOTICE_001') {
               toast.error(err.message);
               router.replace('/notices');
               return;
            }
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [numericNoticeId, retryKey, router]);

   const retry = () => {
      setIsLoading(true);
      setHasError(false);
      setRetryKey((key) => key + 1);
   };

   // 확인 처리 - 취소하는 API가 없어 한 번 확인하면 되돌릴 수 없다(체크박스는 disabled로 잠가둠)
   const handleConfirm = async () => {
      if (!notice || notice.confirmedByMe || isConfirming) return;
      setIsConfirming(true);

      try {
         const result = await confirmNotice(notice.noticeId);
         setNotice({
            ...notice,
            confirmationCount: result.confirmationCount,
            confirmedByMe: result.confirmedByMe,
         });
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '확인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsConfirming(false);
      }
   };

   const handleDelete = async () => {
      if (isDeleting) return;
      setIsDeleting(true);

      try {
         await deleteNotice(numericNoticeId);
         toast.success('공지사항을 삭제했습니다.');
         setIsDeleteConfirmOpen(false);
         router.push('/notices');
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '공지 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsDeleting(false);
      }
   };

   if (!Number.isInteger(numericNoticeId) || (hasError && !isLoading)) {
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
               {hasError ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                     <p className="text-sm text-gray-400">공지사항을 불러오지 못했습니다.</p>
                     <button
                        type="button"
                        onClick={retry}
                        className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                        다시 시도
                     </button>
                  </div>
               ) : (
                  <p className="mt-10 text-center text-sm text-gray-400">
                     공지사항을 찾을 수 없습니다.
                  </p>
               )}
            </div>
         </div>
      );
   }

   if (isLoading || !notice) {
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
               <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
            </div>
         </div>
      );
   }

   const isComplete = notice.confirmedByMe;

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
               <div className="mb-3 px-8 pt-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        {notice.pinned && (
                           <span className="flex items-center gap-1 rounded-xs bg-brand-maroon px-2 py-1 text-xs font-semibold text-white">
                              <Pin size={12} />
                              고정
                           </span>
                        )}
                        <span className="rounded-xs bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                           {notice.categoryName}
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
                           className="flex cursor-pointer items-center gap-1 rounded-xs px-2 py-1 text-brand-maroon hover:bg-[#E5E7EB]"
                        >
                           <Trash2 size={14} />
                           삭제
                        </button>
                     </div>
                  </div>

                  <h1 className="mt-3 text-2xl font-bold text-gray-900">{notice.title}</h1>

                  <div className="mt-2 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                           <User size={15} />
                           {notice.authorName ?? '(알 수 없음)'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-2">
                           <CalendarDays size={15} />
                           {format(new Date(notice.createdAt), 'yyyy-MM-dd')}
                        </span>
                     </div>
                     <label
                        className={`flex items-center gap-2 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1.5 text-sm font-semibold text-gray-700 ${
                           isComplete ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                        }`}
                     >
                        <input
                           type="checkbox"
                           checked={isComplete}
                           disabled={isComplete || isConfirming}
                           onChange={handleConfirm}
                           aria-label="공지 확인"
                           className="h-4 w-4 cursor-pointer rounded-xs accent-brand-green disabled:cursor-not-allowed"
                        />
                        ({notice.confirmationCount}명)
                     </label>
                  </div>
               </div>

               <div className="mx-8 border-t border-[#E5E7EB]" />

               <div
                  className="notice-editor-content px-8 py-6 text-sm"
                  dangerouslySetInnerHTML={{ __html: notice.content }}
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
            title="공지사항을 삭제하시겠습니까?"
            description={
               '삭제한 공지사항은 되돌릴 수 없습니다.\n공지에서 추출되어 등록된 일정의 경우,\n함께 삭제되지 않습니다.'
            }
            confirmLabel={isDeleting ? '삭제 중' : '확인'}
            variant="danger"
            onConfirm={handleDelete}
            onClose={() => !isDeleting && setIsDeleteConfirmOpen(false)}
         />
      </div>
   );
}
