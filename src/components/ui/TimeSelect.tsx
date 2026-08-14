'use client';

import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

interface TimeSelectProps {
   hour: string;
   minute: string;
   onHourChange: (value: string) => void;
   onMinuteChange: (value: string) => void;
   // 기본 10분 단위 목록에 없는 값도 선택지에 포함해야 할 때 추가로 넘긴다
   // (예: 마감 시간의 기본값이 23:59라 "59"를 목록에 추가해야 하는 경우)
   extraMinutes?: string[];
}

// 시/분을 각각 고르는 select 한 쌍 - 값을 지우는 액션은 없다고 보고, value가 비어오면
// (이론상만 가능한 경우) 그냥 기존 값을 유지한다
export default function TimeSelect({
   hour,
   minute,
   onHourChange,
   onMinuteChange,
   extraMinutes,
}: TimeSelectProps) {
   const minuteOptions = extraMinutes ? [...MINUTES, ...extraMinutes] : MINUTES;

   return (
      <div className="flex items-center gap-1">
         <Select value={hour} onValueChange={(value) => onHourChange(value ?? hour)}>
            <SelectTrigger className="h-10 flex-1 rounded-xs">
               <SelectValue placeholder="시" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
               {HOURS.map((h) => (
                  <SelectItem key={h} value={h}>
                     {h}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>
         <span className="text-gray-400">:</span>
         <Select value={minute} onValueChange={(value) => onMinuteChange(value ?? minute)}>
            <SelectTrigger className="h-10 flex-1 rounded-xs">
               <SelectValue placeholder="분" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
               {minuteOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                     {m}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>
      </div>
   );
}
