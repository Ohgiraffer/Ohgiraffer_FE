'use client';

import { format, isValid, parseISO } from 'date-fns';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useTraineeConsultations } from '../../hooks/useTraineeConsultations';

const STATUS_BADGE: Partial<Record<string, { tone: 'gold' | 'neutral'; label: string }>> = {
   PENDING: { tone: 'gold', label: '예정' },
};

function formatScheduledAt(value: string) {
   const date = parseISO(value);
   return isValid(date) ? format(date, 'yyyy.MM.dd HH:mm') : value;
}

export default function ConsultationDetailTab({ traineeId }: { traineeId: number }) {
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

   if (consultations.length === 0) {
      return (
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm text-gray-400">
            상담 이력이 없습니다.
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-3">
         {consultations.map((consultation) => {
            // 문서에 없는 상태값이 오더라도 원본 문자열을 그대로 보여줘 화면이 죽지 않게 한다
            const badge = STATUS_BADGE[consultation.status] ?? {
               tone: 'neutral' as const,
               label: consultation.status,
            };

            return (
               <div
                  key={consultation.consultationId}
                  className="flex items-center justify-between gap-4 rounded-sm border border-[#E5E7EB] bg-white px-6 py-4"
               >
                  <div className="min-w-0">
                     <p className="text-xs text-gray-400">
                        {formatScheduledAt(consultation.scheduledAt)}{' '}
                        <span className="font-medium text-gray-600">{consultation.counselorName}</span>
                     </p>
                     <p className="mt-1 truncate text-sm text-gray-900">{consultation.topic}</p>
                  </div>
                  <StatusBadge tone={badge.tone} className="shrink-0">
                     {badge.label}
                  </StatusBadge>
               </div>
            );
         })}
      </div>
   );
}
