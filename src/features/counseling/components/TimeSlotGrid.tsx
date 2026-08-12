import type { CounselingTimeSlot } from '../types';

type Props = {
   slots: CounselingTimeSlot[];
   onToggle: (time: string) => void;
};

// 09:00~19:00 30분 단위 상담 시간 슬롯 그리드 - 예약된(isBooked) 슬롯은 항상 켜진 채로 토글이 막힌다
export default function TimeSlotGrid({ slots, onToggle }: Props) {
   return (
      <div className="grid grid-cols-7 gap-2">
         {slots.map((slot) => (
            <button
               key={slot.time}
               type="button"
               disabled={slot.isBooked}
               onClick={() => onToggle(slot.time)}
               aria-pressed={slot.isOpen}
               className={`rounded-sm border py-2.5 text-[15px] font-medium transition-colors ${
                  slot.isBooked
                     ? 'cursor-not-allowed border-brand-maroon text-brand-maroon'
                     : slot.isOpen
                       ? 'cursor-pointer border-brand-green bg-brand-sage/20 font-semibold text-brand-green'
                       : 'cursor-pointer border-[#E5E7EB] text-gray-700 hover:bg-gray-50'
               }`}
            >
               {slot.time}
            </button>
         ))}
      </div>
   );
}
