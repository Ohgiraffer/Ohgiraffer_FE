import StatusBadge from '@/features/submissions/components/StatusBadge';
import type { TraineeConsultationEntry } from '../../types';

export default function ConsultationDetailTab({
   consultations,
}: {
   consultations: TraineeConsultationEntry[];
}) {
   if (consultations.length === 0) {
      return (
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm text-gray-400">
            상담 이력이 없습니다.
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-3">
         {consultations.map((consultation, index) => (
            <div
               key={index}
               className="flex items-center justify-between gap-4 rounded-sm border border-[#E5E7EB] bg-white px-6 py-4"
            >
               <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                     {consultation.consultedAt}{' '}
                     <span className="font-medium text-gray-600">{consultation.counselorName}</span>
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-900">{consultation.title}</p>
               </div>
               <StatusBadge tone={consultation.status === '완료' ? 'neutral' : 'gold'} className="shrink-0">
                  {consultation.status}
               </StatusBadge>
            </div>
         ))}
      </div>
   );
}
