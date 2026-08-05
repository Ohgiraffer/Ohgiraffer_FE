import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 로그인/기관 정보가 붙기 전까지 쓰는 더미 부트캠프명
const BOOTCAMP_NAME = '을지대 - React 부트캠프';

export default function DashboardHeader() {
   return (
      <div className="mb-4 ml-1">
         <h1 className="text-xl font-extrabold text-gray-900">{BOOTCAMP_NAME}</h1>
         <p className="mt-1 ml-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays size={14} />
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
         </p>
      </div>
   );
}
