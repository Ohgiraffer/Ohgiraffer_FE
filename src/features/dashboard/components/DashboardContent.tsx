import DashboardCalendar from './DashboardCalendar';
import DashboardHeader from './DashboardHeader';
import TodayScheduleCard from './TodayScheduleCard';
import AttendanceCard from './AttendanceCard';
import NoticeCard from './NoticeCard';
import TodoCard from './TodoCard';

export default function DashboardContent() {
   return (
      <div>
         <DashboardHeader />
         <div className="dashboard-grid grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-[2fr_0.9fr_0.9fr]">
            <div className="[grid-area:calendar]">
               <DashboardCalendar />
            </div>
            <div className="[grid-area:today]">
               <TodayScheduleCard />
            </div>
            <div className="[grid-area:attendance]">
               <AttendanceCard />
            </div>
            <div className="[grid-area:notice]">
               <NoticeCard />
            </div>
            <div className="[grid-area:todo]">
               <TodoCard />
            </div>
         </div>
      </div>
   );
}
