interface InlineProgressBarProps {
   fullWidth?: boolean;
}

// 버튼/카드/헤더 하단 등 좁은 영역에서 쓰는 비결정형(indeterminate) 진행 표시
export default function InlineProgressBar({ fullWidth = false }: InlineProgressBarProps) {
   return (
      <div
         className={`relative h-[5px] overflow-hidden rounded-full bg-muted ${fullWidth ? 'w-full' : 'w-[120px]'}`}
      >
         <div className="progress-sweep absolute top-0 h-full w-[40%] rounded-full bg-brand-green" />
      </div>
   );
}
