import { cn } from '@/lib/utils';

interface InlineProgressBarProps {
   fullWidth?: boolean;
   // 기본 트랙 배경(bg-muted)이 안 맞는 화면에서 덮어쓸 때 사용
   className?: string;
}

// 버튼/카드/헤더 하단 등 좁은 영역에서 쓰는 비결정형(indeterminate) 진행 표시
export default function InlineProgressBar({ fullWidth = false, className }: InlineProgressBarProps) {
   return (
      <div
         className={cn(
            'relative h-[5px] overflow-hidden rounded-full bg-muted',
            fullWidth ? 'w-full' : 'w-[120px]',
            className,
         )}
      >
         <div className="progress-sweep absolute top-0 h-full w-[40%] rounded-full bg-brand-green" />
      </div>
   );
}
