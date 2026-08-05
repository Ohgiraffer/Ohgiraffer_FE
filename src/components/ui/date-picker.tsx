'use client';

import { useState } from 'react';
import { IMaskInput } from 'react-imask';
import { format, isValid, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';

const DATE_FORMAT = 'yyyy-MM-dd';

type DatePickerProps = {
   value: string;
   onChange: (value: string) => void;
   placeholder?: string;
   className?: string;
};

export function DatePicker({
   value,
   onChange,
   placeholder = 'YYYY-MM-DD',
   className,
}: DatePickerProps) {
   const [open, setOpen] = useState(false);

   const parsedDate = value ? parse(value, DATE_FORMAT, new Date()) : undefined;
   const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

   return (
      <div className={cn('relative flex items-center', className)}>
         <IMaskInput
            mask="0000-00-00"
            value={value}
            unmask={false}
            onAccept={(maskedValue: string) => {
               // 마운트 시 react-imask가 초기값을 한 번 정규화하며 onAccept를 호출하는데,
               // 값이 실제로 바뀐 게 아니면 onChange를 부르지 않아 불필요한 dirty 처리를 막는다
               if (maskedValue === value) return;
               onChange(maskedValue);
            }}
            placeholder={placeholder}
            className="w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
         />

         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
               type="button"
               aria-label="달력에서 날짜 선택"
               className="absolute right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
               <CalendarIcon size={16} />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto rounded-sm p-0">
               <Calendar
                  mode="single"
                  locale={ko}
                  weekStartsOn={1}
                  selected={selectedDate}
                  defaultMonth={selectedDate}
                  onSelect={(date) => {
                     if (!date) return;
                     onChange(format(date, DATE_FORMAT));
                     setOpen(false);
                  }}
                  className="[--cell-radius:var(--radius-xs)]"
               />
            </PopoverContent>
         </Popover>
      </div>
   );
}
