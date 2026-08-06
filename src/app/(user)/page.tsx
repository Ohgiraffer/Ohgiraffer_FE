import DashboardContent from '@/features/dashboard/components/DashboardContent';

// 정적 빌드 시 "오늘 날짜"/공휴일 목록이 빌드 시점 값으로 고정되는 것을 막기 위해
// 요청마다 서버에서 렌더링한다 (공휴일 fetch 자체는 getHolidays 내부의
// next:{revalidate}로 하루 단위 캐싱되니 매 요청 외부 API를 다시 부르진 않는다)
export const dynamic = 'force-dynamic';

export default function Page() {
   return (
      <div className="p-6">
         <DashboardContent />
      </div>
   );
}
