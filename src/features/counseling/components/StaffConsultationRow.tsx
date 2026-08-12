import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import type { StaffConsultationSummary } from '@/services/counseling.service';
import CounselingStatusBadge from './CounselingStatusBadge';

type Props = {
   item: StaffConsultationSummary;
   // 지정하면 점 대신 이 번호를 보여준다("전체 상담 이력"에서만 사용)
   index?: number;
   // "전체 상담 이력"은 담당자가 나 하나가 아니라서 담당자 이름도 같이 보여준다
   showCounselorName?: boolean;
   // 'divider': 위아래로 구분선만 있는 표 형태 행("전체 상담 이력")
   // 'card': 항목마다 회색 배경의 개별 카드로 감싸는 형태("다가오는 상담")
   variant?: 'divider' | 'card';
};

// 운영진 "상담 이력 조회" - 다가오는 상담 / 전체 상담 이력에서 같이 쓰는 한 줄.
// 클릭하면 해당 상담의 상세 페이지(/counseling/{id})로 이동한다
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
