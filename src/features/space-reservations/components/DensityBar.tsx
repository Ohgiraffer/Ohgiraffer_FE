type Props = {
   occupied: number;
   capacity: number;
};

// 구역 카드 하단의 정도 표시바(재실 인원/수용 인원)
export default function DensityBar({ occupied, capacity }: Props) {
   const ratio = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

   return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
         <div
            className="h-full rounded-full bg-brand-sage transition-all"
            style={{ width: `${ratio}%` }}
         />
      </div>
   );
}
