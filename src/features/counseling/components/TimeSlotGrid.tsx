import type { CounselingTimeSlot } from '../types';

type Props = {
   slots: CounselingTimeSlot[];
   onToggle: (time: string) => void;
};

// 09:00~19:00 30분 단위 상담 시간 슬롯 그리드
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
                     ? 'bg-[#DC928A]/20 border-brand-red text-brand-red'
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
