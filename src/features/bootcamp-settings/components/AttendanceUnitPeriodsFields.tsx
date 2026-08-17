'use client';

import { Plus, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { PERIOD_ERROR_MESSAGES, type PeriodErrorType } from '../hooks/bootcampPeriodValidation';
import type { BootcampPeriod } from '../types';

type Props = {
   periods: BootcampPeriod[];
   onChange: (periods: BootcampPeriod[]) => void;
   periodErrors?: Record<string, PeriodErrorType>;
};

function createEmptyPeriod(): BootcampPeriod {
   return { id: crypto.randomUUID(), startDate: '', endDate: '' };
}

export default function AttendanceUnitPeriodsFields({ periods, onChange, periodErrors }: Props) {
   const addPeriod = () => {
      onChange([...periods, createEmptyPeriod()]);
   };

   const updatePeriod = (id: string, field: 'startDate' | 'endDate', value: string) => {
      onChange(
         periods.map((period) => (period.id === id ? { ...period, [field]: value } : period)),
      );
   };

   const removePeriod = (id: string) => {
      onChange(periods.filter((period) => period.id !== id));
   };

   return (
      <div>
         {periods.length === 0 ? (
            <p className="mt-2 rounded-xs border border-dashed border-gray-300 px-4 py-3 text-center text-sm text-gray-400">
               단위기간을 추가해주세요.
            </p>
         ) : (
            <div className="mt-2 flex flex-col gap-3">
               {periods.map((period, index) => {
                  const errorType = periodErrors?.[period.id] ?? null;

                  return (
                     <div
                        key={period.id}
                        className="relative rounded-sm border border-gray-200 p-4"
                     >
                        <button
                           type="button"
                           onClick={() => removePeriod(period.id)}
                           aria-label="단위기간 삭제"
                           className="absolute right-3 top-3 cursor-pointer rounded-sm p-1 text-[#9CA3AF] hover:text-brand-maroon"
                        >
                           <X size={16} />
                        </button>

                        <p className="text-sm text-[#6B7280]">{index + 1}단위기간</p>

                        <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <div>
                              <label className="text-[13px] font-semibold text-gray-900">
                                 시작일
                              </label>
                              <DatePicker
                                 value={period.startDate}
                                 onChange={(value) => updatePeriod(period.id, 'startDate', value)}
                                 className="mt-1"
                              />
                           </div>
                           <div>
                              <label className="text-[13px] font-semibold text-gray-900">
                                 종료일
                              </label>
                              <DatePicker
                                 value={period.endDate}
                                 onChange={(value) => updatePeriod(period.id, 'endDate', value)}
                                 className="mt-1"
                              />
                              <p
                                 className={`mt-1 text-xs text-brand-red ${
                                    errorType ? 'visible' : 'invisible'
                                 }`}
                              >
                                 {errorType ? PERIOD_ERROR_MESSAGES[errorType] : ''}
                              </p>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}

         <button
            type="button"
            onClick={addPeriod}
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"
         >
            <Plus size={16} />
            단위기간 추가
         </button>
      </div>
   );
}
