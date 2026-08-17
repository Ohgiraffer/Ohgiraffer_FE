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
   id?: string;
};

export function DatePicker({
   value,
   onChange,
   placeholder = 'YYYY-MM-DD',
   className,
   id,
}: DatePickerProps) {
   const [open, setOpen] = useState(false);

   const parsedDate = value ? parse(value, DATE_FORMAT, new Date()) : undefined;
   const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

   return (
      <div className={cn('relative flex items-center', className)}>
         <IMaskInput
            id={id}
            mask="0000-00-00"
            value={value}
            unmask={false}
            onAccept={(maskedValue, maskRef) => {
               if (maskedValue === value) return;

               if (
                  maskedValue.length === 10 &&
                  !isValid(parse(maskedValue, DATE_FORMAT, new Date()))
               ) {
                  maskRef.value = value;
                  return;
               }

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
            <PopoverContent align="end" className="w-auto rounded-xs p-0">
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
