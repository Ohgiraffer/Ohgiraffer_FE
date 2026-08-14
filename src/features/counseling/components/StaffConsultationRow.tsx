import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import type { StaffConsultationSummary } from '@/services/counseling.service';
import CounselingStatusBadge from './CounselingStatusBadge';

type Props = {
   item: StaffConsultationSummary;
   index?: number;
   showCounselorName?: boolean;
   variant?: 'divider' | 'card';
};

export default function StaffConsultationRow({
   item,
   index,
   showCounselorName,
   variant = 'divider',
}: Props) {
   const dateLabel = format(parseISO(item.scheduledAt), 'yyyy.MM.dd HH:mm');
   const subtitle = showCounselorName
      ? `${dateLabel} · ${item.counselorName} · ${item.requesterName}`
      : `${dateLabel} · ${item.requesterName}`;

   return (
      <Link
         href={`/counseling/${item.consultationId}`}
         className={`flex cursor-pointer items-center justify-between transition-colors ${
            variant === 'card'
               ? 'rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 hover:bg-[#F3F4F6]'
               : 'px-6 py-3 hover:bg-[#F9FAFB]'
         }`}
      >
         <div className="flex items-center gap-4">
            {index !== undefined ? (
               <span className="w-5 text-center text-sm text-gray-400">{index}</span>
            ) : (
               <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sage" />
            )}
            <div>
               <p className="text-sm font-semibold text-gray-900">{item.topic}</p>
               <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <CounselingStatusBadge status={item.status} />
            <ChevronRight size={16} className="text-gray-300" />
         </div>
      </Link>
   );
}
