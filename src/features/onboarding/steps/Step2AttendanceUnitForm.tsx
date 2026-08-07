'use client';

import { Plus, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import type { PeriodErrorType } from '../hooks/useOnboardingWizard';
import type { AttendanceUnitData, AttendanceUnitPeriod } from '../types';

type Props = {
   value: AttendanceUnitData;
   onChange: (value: AttendanceUnitData) => void;
   periodErrors?: Record<string, PeriodErrorType>;
};

const PERIOD_ERROR_MESSAGES: Record<Exclude<PeriodErrorType, null>, string> = {
   order: '종료일은 시작일보다 빠를 수 없습니다.',
   range: '단위기간은 부트캠프 기간 내에 있어야 합니다.',
   overlap: '다른 단위기간과 기간이 겹칩니다.',
   startBoundary: '첫 단위기간 시작일은 부트캠프 시작일과 같아야 합니다.',
   endBoundary: '마지막 단위기간 종료일은 부트캠프 종료일과 같아야 합니다.',
};

function createEmptyPeriod(): AttendanceUnitPeriod {
   return { id: crypto.randomUUID(), startDate: '', endDate: '' };
}

export default function Step2AttendanceUnitForm({ value, onChange, periodErrors }: Props) {
   const addPeriod = () => {
      onChange({ periods: [...value.periods, createEmptyPeriod()] });
   };

   const updatePeriod = (id: string, field: 'startDate' | 'endDate', fieldValue: string) => {
      onChange({
         periods: value.periods.map((period) =>
            period.id === id ? { ...period, [field]: fieldValue } : period,
         ),
      });
   };

   const removePeriod = (id: string) => {
      onChange({ periods: value.periods.filter((period) => period.id !== id) });
   };

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10">
         <h2 className="text-xl font-bold text-black">출결 단위기간 기준</h2>
         <p className="mt-1 text-[14px] text-[#6B7280]">
            출결률을 집계할 단위기간의 시작일·종료일을 직접 지정합니다.
         </p>

         <div className="mt-7">
            <label className="text-[15px] font-semibold text-gray-900">
               단위기간 설정 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>

            {value.periods.length === 0 ? (
               <p className="mt-2 rounded-xs border border-dashed border-gray-300 px-4 py-3 text-center text-sm text-gray-400">
                  단위기간을 추가해주세요.
               </p>
            ) : (
               <div className="mt-2 flex flex-col gap-3">
                  {value.periods.map((period, index) => {
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

                           <div className="mt-1 grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-[13px] font-semibold text-gray-900">
                                    시작일
                                 </label>
                                 <DatePicker
                                    value={period.startDate}
                                    onChange={(nextValue) =>
                                       updatePeriod(period.id, 'startDate', nextValue)
                                    }
                                    className="mt-1"
                                 />
                              </div>
                              <div>
                                 <label className="text-[13px] font-semibold text-gray-900">
                                    종료일
                                 </label>
                                 <DatePicker
                                    value={period.endDate}
                                    onChange={(nextValue) =>
                                       updatePeriod(period.id, 'endDate', nextValue)
                                    }
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

         <div className="mt-7">
            <p className="text-[15px] font-semibold text-gray-900">지각·조퇴·외출 환산 횟수</p>
            <div className="mt-2 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-gray-700">
               지각·조퇴·외출 <span className="font-bold">3회</span> = 결석 1회로 환산{' '}
               <span className="text-xs text-[#9CA3AF]">(규정집 고정값)</span>
            </div>
         </div>

         <div className="mt-3 rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-3">
            <p className="text-[13px] font-semibold text-gray-900">
               내일배움카드 부트캠프 규정 안내
            </p>
            <p className="mt-1 text-[13px] text-gray-600">
               지각·조퇴 3회 = 결석 1회 환산, 출석률 80% 미만 시 수료 불인정 처리됩니다.
            </p>
         </div>
      </div>
   );
}
