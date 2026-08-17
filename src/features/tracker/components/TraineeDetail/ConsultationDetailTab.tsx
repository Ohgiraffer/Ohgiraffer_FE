'use client';

import { useRouter } from 'next/navigation';
import { format, isValid, parseISO } from 'date-fns';
import CounselingStatusBadge from '@/features/counseling/components/CounselingStatusBadge';
import { useTraineeConsultations } from '../../hooks/useTraineeConsultations';

function formatScheduledAt(value: string) {
   const date = parseISO(value);
   return isValid(date) ? format(date, 'yyyy.MM.dd HH:mm') : value;
}

export default function ConsultationDetailTab({ traineeId }: { traineeId: number }) {
   const router = useRouter();
   const { consultations, isLoading, error, retry } = useTraineeConsultations(traineeId);

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (error) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">상담 이력을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={retry}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }

   return (
      <>
         <div className="divide-y divide-[#F3F4F6] overflow-hidden rounded-sm border border-[#E5E7EB] bg-white md:hidden">
            {consultations.length === 0 ? (
               <p className="px-6 py-10 text-center text-sm text-gray-400">상담 이력이 없습니다.</p>
            ) : (
               consultations.map((consultation) => (
                  <div
                     key={consultation.consultationId}
                     onClick={() => router.push(`/counseling/${consultation.consultationId}`)}
                     className="cursor-pointer p-4 transition-colors hover:bg-[#F9FAFB]"
                  >
                     <div className="flex items-start justify-between gap-2">
                        <p
                           className="min-w-0 truncate text-sm font-medium text-gray-900"
                           title={consultation.topic}
                        >
                           {consultation.topic}
                        </p>
                        <CounselingStatusBadge status={consultation.status} />
                     </div>
                     <p className="mt-1 text-xs text-gray-400">
                        {formatScheduledAt(consultation.scheduledAt)}{' '}
                        <span className="font-medium text-gray-600">{consultation.counselorName}</span>
                     </p>
                  </div>
               ))
            )}
         </div>

         <div className="hidden overflow-hidden rounded-sm border border-[#E5E7EB] bg-white md:block">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[22%] px-6 py-3 font-medium">일시</th>
                     <th className="w-[18%] px-6 py-3 font-medium">담당자</th>
                     <th className="w-[40%] px-6 py-3 font-medium">주제</th>
                     <th className="w-[20%] px-6 py-3 text-center font-medium">상태</th>
                  </tr>
               </thead>
               <tbody>
                  {consultations.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                           상담 이력이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     consultations.map((consultation) => (
                        <tr
                           key={consultation.consultationId}
                           onClick={() => router.push(`/counseling/${consultation.consultationId}`)}
                           className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                        >
                           <td className="px-6 py-4 text-gray-700">
                              {formatScheduledAt(consultation.scheduledAt)}
                           </td>
                           <td className="px-6 py-4 text-gray-700">{consultation.counselorName}</td>
                           <td className="px-6 py-4 font-medium text-gray-900">
                              <p className="truncate" title={consultation.topic}>
                                 {consultation.topic}
                              </p>
                           </td>
                           <td className="px-6 py-4 text-center">
                              <CounselingStatusBadge status={consultation.status} />
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </>
   );
}
