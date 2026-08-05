import { ClipboardCheck, TriangleAlert } from 'lucide-react';

interface AttendanceStat {
   label: string;
   value: string;
   colorClassName: string;
}

// 하드코딩된 더미 데이터 — 추후 API 연동 예정
const ATTENDANCE_RATE = 87;

const ATTENDANCE_STATS: AttendanceStat[] = [
   { label: '출석', value: '87일', colorClassName: 'bg-brand-sage' },
   { label: '지각', value: '5회', colorClassName: 'bg-brand-red/40' },
   { label: '조퇴', value: '3회', colorClassName: 'bg-brand-red' },
   { label: '외출', value: '4회', colorClassName: 'bg-brand-red/20' },
   { label: '결석', value: '8일', colorClassName: 'bg-brand-maroon' },
];

export default function AttendanceCard() {
   return (
      <div className="h-full rounded-sm border border-gray-200 bg-white p-6 lg:p-4">
         <div className="mb-4 flex items-center justify-between lg:mb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
               <ClipboardCheck size={16} className="text-gray-400" />
               출결 현황
            </h2>
            <span className="text-xs text-gray-400">상세</span>
         </div>

         <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gray-900 lg:text-2xl">{ATTENDANCE_RATE}%</span>
            <span className="text-sm text-gray-400">출석률</span>
         </div>
         <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 lg:mb-2">
            <div className="h-full bg-brand-red" style={{ width: `${ATTENDANCE_RATE}%` }} />
         </div>

         <ul className="mb-4 flex flex-col gap-2 lg:mb-2 lg:gap-1">
            {ATTENDANCE_STATS.map((stat) => (
               <li key={stat.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${stat.colorClassName}`} />
                  <span className="flex-1 text-gray-600">{stat.label}</span>
                  <span className="font-medium text-gray-900">{stat.value}</span>
               </li>
            ))}
         </ul>

         <div className="flex items-center gap-1.5 rounded-sm bg-[#F5DFDC] px-3 py-2 text-xs text-brand-maroon lg:py-1.5">
            <TriangleAlert size={14} />
            경고 — 출석률 기준 근접 중
         </div>
      </div>
   );
}
