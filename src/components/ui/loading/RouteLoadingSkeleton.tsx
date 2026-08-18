import { Skeleton, SkeletonListRow } from './Skeleton';

// 라우트 전환 시 Next.js가 자동으로 띄우는 페이지 단위 스켈레톤(loading.tsx 전용).
// 페이지마다 정확한 모양을 맞추기보다, 제목줄 + 목록형 콘텐츠라는 공통 뼈대만 채워
// 빈 화면이 뜨지 않게 하는 용도라 여러 라우트가 그대로 재사용한다
export default function RouteLoadingSkeleton() {
   return (
      <div className="p-8">
         <Skeleton width={160} height={28} className="mb-6 rounded-md" />
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            {[0, 1, 2, 3, 4].map((i) => (
               <SkeletonListRow key={i} index={i} />
            ))}
         </div>
      </div>
   );
}
