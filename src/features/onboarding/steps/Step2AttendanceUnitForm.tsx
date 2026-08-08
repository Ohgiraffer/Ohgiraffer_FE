'use client';

import AttendanceUnitPeriodsFields from '@/features/bootcamp-settings/components/AttendanceUnitPeriodsFields';
import type { PeriodErrorType } from '@/features/bootcamp-settings/hooks/bootcampPeriodValidation';
import type { AttendanceUnitData } from '../types';

type Props = {
   value: AttendanceUnitData;
   onChange: (value: AttendanceUnitData) => void;
   periodErrors?: Record<string, PeriodErrorType>;
};

export default function Step2AttendanceUnitForm({ value, onChange, periodErrors }: Props) {
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

            <AttendanceUnitPeriodsFields
               periods={value.periods}
               onChange={(periods) => onChange({ periods })}
               periodErrors={periodErrors}
            />
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
