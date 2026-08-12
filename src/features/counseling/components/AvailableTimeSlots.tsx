import type { AvailableTimeSlot } from '@/services/counseling.service';

type Props = {
   times: AvailableTimeSlot[];
   selectedTime: string | null;
   onSelect: (time: string) => void;
};

// 훈련생 "상담 신청" - 선택한 운영진·날짜의 가능 시간 중 하나를 고른다.
// 다른 훈련생이 이미 예약한(isReserved) 시간은 목록에 보이되 선택할 수 없다
export default function AvailableTimeSlots({ times, selectedTime, onSelect }: Props) {
   if (times.length === 0) {
      return (
         <p className="py-15 text-center text-sm text-gray-400">
            선택한 날짜에 상담 가능한 시간이 없습니다.
         </p>
      );
   }

   return (
      <div className="grid grid-cols-7 gap-2">
         {times.map((slot) => (
            <button
               key={slot.time}
               type="button"
               disabled={slot.isReserved}
               onClick={() => onSelect(slot.time)}
               aria-pressed={slot.time === selectedTime}
               className={`rounded-xs border py-2.5 text-sm font-medium transition-colors ${
                  slot.isReserved
                     ? 'bg-[#DC928A]/20 border-brand-red text-brand-red'
                     : slot.time === selectedTime
                       ? 'cursor-pointer border-brand-green bg-[#F0F4F2] text-brand-green'
                       : 'cursor-pointer border-[#E5E7EB] text-gray-700 hover:bg-gray-50'
               }`}
            >
               {slot.time}
            </button>
         ))}
      </div>
   );
}
