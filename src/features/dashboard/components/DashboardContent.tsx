import DashboardHeader from './DashboardHeader';
import DashboardGrid from './DashboardGrid';
import { getHolidays } from '@/services/holiday.service';

export default async function DashboardContent() {
   const holidays = await getHolidays(new Date().getFullYear());

   return (
      <div>
         <DashboardHeader />
         <DashboardGrid holidays={holidays} />
      </div>
   );
}
