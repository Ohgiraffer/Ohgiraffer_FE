'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import CounselingStatusBadge from './CounselingStatusBadge';
import CounselorNoteSection from './CounselorNoteSection';
import { useCounselingDetail } from '../hooks/useCounselingDetail';

type Props = {
   consultationId: string;
};

// 상담 이력 목록(/counseling)뿐 아니라 훈련생 상세의 상담 탭에서도 이 페이지로 들어올 수 있어서,
// 특정 경로로 고정하지 않고 실제로 들어온 곳으로 되돌아가게 한다
function BackLink() {
   const router = useRouter();
   return (
      <button
         type="button"
         onClick={() => router.back()}
         className="inline-flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
         <ChevronLeft size={16} />
         목록으로
      </button>
   );
}

// 상담 상세 페이지
export default function CounselingDetailClient({ consultationId }: Props) {
   const numericId = Number(consultationId);
   const { detail, setDetail, isLoading, hasError, isMyConsultation } =
      useCounselingDetail(numericId);

   if (!Number.isInteger(numericId) || (hasError && !isLoading)) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="mx-auto w-full max-w-3xl">
               <BackLink />
               <p className="mt-10 text-center text-sm text-gray-400">
                  상담 정보를 불러오지 못했습니다.
               </p>
            </div>
         </div>
      );
   }

   if (isLoading || !detail) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="mx-auto w-full max-w-3xl">
               <BackLink />

               <div className="mt-4 rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
                  <div className="flex items-center gap-3">
                     <Skeleton width="40%" height={22} className="rounded-md" />
                     <Skeleton width={48} height={22} className="rounded-xs" />
                  </div>

                  <hr className="mt-4 border-[#F3F4F6]" />

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <div>
                        <Skeleton width={40} height={12} className="rounded-md" />
                        <Skeleton width="60%" height={15} className="mt-2 rounded-md" />
                     </div>
                     <div>
                        <Skeleton width={40} height={12} className="rounded-md" />
                        <Skeleton width="60%" height={15} className="mt-2 rounded-md" />
                     </div>
                  </div>

                  <div className="mt-4">
                     <Skeleton width={24} height={12} className="rounded-md" />
                     <Skeleton width="35%" height={15} className="mt-2 rounded-md" />
                  </div>

                  <div className="mt-5">
                     <Skeleton width={64} height={14} className="rounded-md" />
                     <Skeleton width="100%" height={64} className="mt-2 rounded-xs" />
                  </div>

                  <div className="mt-5 border-t border-[#F3F4F6] pt-5">
                     <Skeleton width={64} height={14} className="rounded-md" />
                     <Skeleton width="100%" height={96} className="mt-2 rounded-xs" />
                  </div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <div className="mx-auto w-full max-w-3xl">
            <BackLink />

            <div className="mt-4 rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
               <h1 className="flex items-center gap-3 text-xl font-bold break-keep text-gray-900">
                  {detail.topic}
                  <CounselingStatusBadge status={detail.status} />
               </h1>

               <hr className="mt-4 border-[#F3F4F6]" />

               <div className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                     <p className="text-[13px] text-[#9CA3AF]">신청자</p>
                     <p className="mt-1 text-[15px] text-gray-900">{detail.requesterName}</p>
                  </div>
                  <div>
                     <p className="text-[13px] text-[#9CA3AF]">담당자</p>
                     <p className="mt-1 text-[15px] text-gray-900">{detail.counselorName}</p>
                  </div>
               </div>

               <div className="mt-4 text-sm">
                  <p className="text-[13px] text-[#9CA3AF]">일시</p>
                  <p className="mt-1 text-[15px] text-gray-900">
                     {format(parseISO(detail.scheduledAt), 'yyyy-MM-dd HH:mm')}
                  </p>
               </div>

               <div className="mt-5">
                  <p className="text-sm font-semibold text-[#374151]">요청 내용</p>
                  <p className="mt-2 rounded-xs bg-[#F9FAFB] p-3 text-sm whitespace-pre-line text-gray-700">
                     {detail.content}
                  </p>
               </div>

               {/* 취소된 상담은 메모를 남길 수 없다 */}
               {isMyConsultation && detail.status !== 'CANCELLED' && (
                  <CounselorNoteSection detail={detail} onSaved={setDetail} />
               )}
            </div>
         </div>
      </div>
   );
}
