'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/shadcn/button';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createCalendarEvent, type CalendarEventApiType } from '@/services/calendarEvent.service';
import { type EventType } from './DashboardCalendar';

interface CreateEventModalProps {
   defaultDate: Date;
   onClose: () => void;
   onCreated: () => void;
}

const MANAGER_EVENT_TYPES: EventType[] = ['수업/발표', '행사', '개인'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '10', '20', '30', '40', '50'];

// 수업/발표는 화면에서 하나로 묶어 보여주되 API로는 항상 CLASS로 전송한다
const EVENT_TYPE_TO_API: Record<EventType, CalendarEventApiType> = {
   '수업/발표': 'CLASS',
   행사: 'EVENT',
   개인: 'PERSONAL',
};

function toDateInputValue(date: Date) {
   const offset = date.getTimezoneOffset();
   return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function CreateEventModal({ defaultDate, onClose, onCreated }: CreateEventModalProps) {
   const { role } = useAuth();
   const isStaff = role === 'MANAGER' || role === 'INSTRUCTOR';

   const [title, setTitle] = useState('');
   const [type, setType] = useState<EventType>('수업/발표');
   const [startDate, setStartDate] = useState(() => toDateInputValue(defaultDate));
   const [endDate, setEndDate] = useState(() => toDateInputValue(defaultDate));
   const [startHour, setStartHour] = useState('');
   const [startMinute, setStartMinute] = useState('');
   const [endHour, setEndHour] = useState('');
   const [endMinute, setEndMinute] = useState('');
   const [place, setPlace] = useState('');
   const [notifyConsent, setNotifyConsent] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const isDateRangeInvalid = endDate < startDate;
   const startTimeValue = startHour && startMinute ? `${startHour}:${startMinute}` : undefined;
   const endTimeValue = endHour && endMinute ? `${endHour}:${endMinute}` : undefined;
   // 종료일이 시작일과 같은 날이면 종료 시각이 시작 시각보다 빠르거나 같을 수 없다(서버가 COMMON_001로 거부함)
   const isTimeRangeInvalid =
      startDate === endDate && !!startTimeValue && !!endTimeValue && endTimeValue <= startTimeValue;
   // 운영진이 "개인"을 선택하면 훈련생의 개인 일정 등록과 동일하게 알림 동의가 필요 없다
   const needsNotifyConsent = isStaff && type !== '개인';
   const canSubmit =
      title.trim().length > 0 &&
      !isDateRangeInvalid &&
      !isTimeRangeInvalid &&
      (!needsNotifyConsent || notifyConsent);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit || isSubmitting) return;
      setIsSubmitting(true);
      try {
         await createCalendarEvent({
            title: title.trim(),
            eventType: isStaff ? EVENT_TYPE_TO_API[type] : undefined,
            startDate,
            startTime: startTimeValue,
            endDate,
            endTime: endTimeValue,
            location: place.trim() || undefined,
            notifyTrainees: needsNotifyConsent ? notifyConsent : undefined,
         });
         onCreated();
      } catch (err) {
         toast.error(
            err instanceof ApiError ? err.message : '일정 등록에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsSubmitting(false);
      }
   };

   const modalTitle = `${format(defaultDate, 'M월 d일', { locale: ko })} 일정 등록`;

   return (
      <Modal
         onClose={onClose}
         ariaLabel={modalTitle}
         panelClassName="w-full max-w-120"
         closeOnBackdropClick={false}
      >
         <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{modalTitle}</h2>
         </div>

         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
               <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  일정명 <span className="text-brand-red">*</span>
               </label>
               <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="일정명을 입력해주세요"
                  className="h-10 w-full rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
               />
            </div>

            <div>
               <label className="mb-1.5 block text-sm font-medium text-gray-700">유형</label>
               {isStaff ? (
                  <Select value={type} onValueChange={(value) => setType(value as EventType)}>
                     <SelectTrigger className="h-10 w-full rounded-sm">
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {MANAGER_EVENT_TYPES.map((t) => (
                           <SelectItem key={t} value={t}>
                              {t}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               ) : (
                  <p className="flex h-10 w-full items-center rounded-sm border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                     유형: 개인 일정으로 자동 등록됩니다
                  </p>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                     시작일 <span className="text-brand-red">*</span>
                  </label>
                  <DatePicker value={startDate} onChange={setStartDate} />
               </div>
               <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                     종료일 <span className="text-brand-red">*</span>
                  </label>
                  <DatePicker value={endDate} onChange={setEndDate} />
                  {isDateRangeInvalid && (
                     <p className="mt-1 text-xs text-brand-red">종료일은 시작일보다 빠를 수 없습니다</p>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                     시작 시각 <span className="text-gray-400">(선택)</span>
                  </label>
                  <div className="flex items-center gap-1">
                     <Select
                        value={startHour}
                        onValueChange={(value) => {
                           setStartHour(value ?? '');
                           if (!startMinute) setStartMinute('00');
                        }}
                     >
                        <SelectTrigger className="h-10 flex-1 rounded-sm">
                           <SelectValue placeholder="시" />
                        </SelectTrigger>
                        <SelectContent>
                           {HOURS.map((h) => (
                              <SelectItem key={h} value={h}>
                                 {h}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <span className="text-gray-400">:</span>
                     <Select
                        value={startMinute}
                        onValueChange={(value) => {
                           setStartMinute(value ?? '');
                           if (!startHour) setStartHour('00');
                        }}
                     >
                        <SelectTrigger className="h-10 flex-1 rounded-sm">
                           <SelectValue placeholder="분" />
                        </SelectTrigger>
                        <SelectContent>
                           {MINUTES.map((m) => (
                              <SelectItem key={m} value={m}>
                                 {m}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                     종료 시각 <span className="text-gray-400">(선택)</span>
                  </label>
                  <div className="flex items-center gap-1">
                     <Select
                        value={endHour}
                        onValueChange={(value) => {
                           setEndHour(value ?? '');
                           if (!endMinute) setEndMinute('00');
                        }}
                     >
                        <SelectTrigger className="h-10 flex-1 rounded-sm">
                           <SelectValue placeholder="시" />
                        </SelectTrigger>
                        <SelectContent>
                           {HOURS.map((h) => (
                              <SelectItem key={h} value={h}>
                                 {h}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <span className="text-gray-400">:</span>
                     <Select
                        value={endMinute}
                        onValueChange={(value) => {
                           setEndMinute(value ?? '');
                           if (!endHour) setEndHour('00');
                        }}
                     >
                        <SelectTrigger className="h-10 flex-1 rounded-sm">
                           <SelectValue placeholder="분" />
                        </SelectTrigger>
                        <SelectContent>
                           {MINUTES.map((m) => (
                              <SelectItem key={m} value={m}>
                                 {m}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  {isTimeRangeInvalid && (
                     <p className="mt-1 text-xs text-brand-red">종료 시각은 시작 시각보다 빠를 수 없습니다</p>
                  )}
               </div>
            </div>

            <div>
               <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  장소 <span className="text-gray-400">(선택)</span>
               </label>
               <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="장소를 입력해주세요"
                  className="h-10 w-full rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
               />
            </div>

            {needsNotifyConsent && (
               <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-brand-gold/40 bg-brand-cream/40 p-3 text-xs text-gray-700">
                  <input
                     type="checkbox"
                     checked={notifyConsent}
                     onChange={(e) => setNotifyConsent(e.target.checked)}
                     className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-green"
                  />
                  등록 시 전체 훈련생에게 알림이 발송됩니다. 일정을 등록하시겠습니까?
               </label>
            )}

            <div className="mt-1 flex gap-2">
               <button
                  type="button"
                  onClick={onClose}
                  className="h-10 flex-1 cursor-pointer rounded-sm border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
               >
                  취소
               </button>
               <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="h-10 flex-1 rounded-sm bg-brand-green hover:bg-[#4D655A] disabled:bg-gray-200 disabled:text-gray-400"
               >
                  {isSubmitting ? '등록 중...' : '등록'}
               </Button>
            </div>
         </form>
      </Modal>
   );
}
