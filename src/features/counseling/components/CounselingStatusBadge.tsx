import type { ConsultationStatus } from '@/services/counseling.service';

const STATUS_LABEL: Record<ConsultationStatus, string> = {
   PENDING: '예정',
   COMPLETED: '완료',
   CANCELLED: '취소',
};

const STATUS_TONE: Record<ConsultationStatus, string> = {
   PENDING: 'bg-[#F8EFCA] text-[#9A7A1A]',
   COMPLETED: 'bg-brand-sage/20 text-brand-green',
   CANCELLED: 'bg-[#DC928A]/20 text-brand-red',
};

type Props = {
   status: ConsultationStatus;
};

// 상담 예정/완료 공용 배지 - 목록·상세 모달에서 같이 씀
export default function CounselingStatusBadge({ status }: Props) {
   return (
      <span
         className={`inline-flex items-center justify-center rounded-xs px-2.5 py-1 text-xs font-semibold ${
            STATUS_TONE[status] ?? 'bg-gray-100 text-gray-500'
         }`}
      >
         {STATUS_LABEL[status] ?? status}
      </span>
   );
}
