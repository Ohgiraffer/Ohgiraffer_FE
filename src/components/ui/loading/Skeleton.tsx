interface SkeletonProps {
   width: number | string;
   height: number | string;
   className?: string;
}

// 기본 단위 스켈레톤 블록
export function Skeleton({ width, height, className = '' }: SkeletonProps) {
   return (
      <div className={`relative overflow-hidden bg-muted ${className}`} style={{ width, height }}>
         <div className="skeleton-shimmer absolute inset-0" />
      </div>
   );
}

interface SkeletonRowProps {
   index?: number;
}

// 제출물 관리 목록, 훈련생 관리 목록 등 목록 한 줄 자리표시
export function SkeletonListRow({ index = 0 }: SkeletonRowProps) {
   return (
      <div
         className="flex items-center gap-4 border-b border-gray-100 px-4 py-3"
         style={{ '--row-delay': `${index * 0.15}s` } as React.CSSProperties}
      >
         <Skeleton width={40} height={40} className="shrink-0 rounded-full" />
         <div className="flex flex-1 flex-col gap-2">
            <Skeleton width="60%" height={14} className="rounded-md" />
            <Skeleton width="40%" height={12} className="rounded-md" />
         </div>
         <Skeleton width={72} height={28} className="shrink-0 rounded-md" />
      </div>
   );
}

// 카드형 목록 자리표시
export function SkeletonCard({ index = 0 }: SkeletonRowProps) {
   return (
      <div
         className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
         style={{ '--row-delay': `${index * 0.15}s` } as React.CSSProperties}
      >
         <Skeleton width="100%" height={120} className="rounded-md" />
         <Skeleton width="70%" height={16} className="rounded-md" />
         <Skeleton width="50%" height={12} className="rounded-md" />
      </div>
   );
}
