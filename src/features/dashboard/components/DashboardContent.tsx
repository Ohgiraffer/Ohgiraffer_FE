import DashboardHeader from './DashboardHeader';
import DashboardGrid from './DashboardGrid';
import { getHolidays } from '@/services/holiday.service';

export default async function DashboardContent() {
   // 서버에서 한 번만 계산해서 DashboardGrid/DashboardCalendar에 그대로 내려준다 - 각자
   // new Date()를 따로 부르면 자정 경계·서버-클라이언트 시계 차이로 연·월이 어긋나면서
   // hydration mismatch(월 헤더/공휴일 매핑 불일치)가 날 수 있다
   const now = new Date();
   const initialYear = now.getFullYear();
   const initialMonth = now.getMonth() + 1;
   const holidays = await getHolidays(initialYear);

   return (
      <div>
         <DashboardHeader />
         <DashboardGrid holidays={holidays} initialYear={initialYear} initialMonth={initialMonth} />
      </div>
   );
}
