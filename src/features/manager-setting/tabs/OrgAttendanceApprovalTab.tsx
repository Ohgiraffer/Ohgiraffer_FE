'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { MOCK_ORG_SETTINGS } from '../mockData';
import type { AttendanceUnitPeriod, OrgSettingsData, WarningCriteria } from '../types';

type TextField = 'orgName' | 'courseName' | 'startDate' | 'endDate';

function createEmptyPeriod(): AttendanceUnitPeriod {
   return { id: crypto.randomUUID(), startDate: '', endDate: '' };
}

export default function OrgAttendanceApprovalTab() {
   const [orgSettings, setOrgSettings] = useState<OrgSettingsData>(MOCK_ORG_SETTINGS);
   const [isDirty, setIsDirty] = useState(false);
   const [hasAttemptedSave, setHasAttemptedSave] = useState(false);
   const [orgInfoSubmitAttempted, setOrgInfoSubmitAttempted] = useState(false);

   const updateField = (field: TextField, value: string) => {
      setOrgSettings((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
   };

   const updateWarningCriteria = (field: keyof WarningCriteria, value: string) => {
      // max 속성만으로는 100 초과 타이핑을 막지 못해 여기서 한 번 더 제한
      const clampedValue = value !== '' && Number(value) > 100 ? '100' : value;
      setOrgSettings((prev) => ({
         ...prev,
         warningCriteria: { ...prev.warningCriteria, [field]: clampedValue },
      }));
      setIsDirty(true);
   };

   const updatePeriod = (id: string, field: 'startDate' | 'endDate', value: string) => {
      setOrgSettings((prev) => ({
         ...prev,
         attendanceUnitPeriods: prev.attendanceUnitPeriods.map((period) =>
            period.id === id ? { ...period, [field]: value } : period,
         ),
      }));
      setIsDirty(true);
   };

   const removePeriod = (id: string) => {
      setOrgSettings((prev) => ({
         ...prev,
         attendanceUnitPeriods: prev.attendanceUnitPeriods.filter((period) => period.id !== id),
      }));
      setIsDirty(true);
   };

   const addPeriod = () => {
      setOrgSettings((prev) => ({
         ...prev,
         attendanceUnitPeriods: [...prev.attendanceUnitPeriods, createEmptyPeriod()],
      }));
   };

   const attendanceDateErrors: Record<string, boolean> = hasAttemptedSave
      ? Object.fromEntries(
           orgSettings.attendanceUnitPeriods.map((period) => [
              period.id,
              Boolean(period.startDate) &&
                 Boolean(period.endDate) &&
                 period.startDate > period.endDate,
           ]),
        )
      : {};

   const orgInfoDateError =
      orgInfoSubmitAttempted &&
      Boolean(orgSettings.startDate) &&
      Boolean(orgSettings.endDate) &&
      orgSettings.startDate > orgSettings.endDate;

   // *(필수) 표시된 항목들 - 하나라도 비면 저장 자체를 막는다 (날짜 순서는 별개로 저장 시점에 안내)
   const isOrgInfoFilled = Boolean(
      orgSettings.orgName.trim() &&
         orgSettings.courseName.trim() &&
         orgSettings.startDate &&
         orgSettings.endDate,
   );
   const isAttendanceUnitFilled =
      orgSettings.attendanceUnitPeriods.length > 0 &&
      orgSettings.attendanceUnitPeriods.every((period) => period.startDate && period.endDate);
   const isSaveEnabled = isDirty && isOrgInfoFilled && isAttendanceUnitFilled;

   const handleSave = () => {
      const hasOrgDateOrderError = orgSettings.startDate > orgSettings.endDate;
      const hasPeriodDateOrderError = orgSettings.attendanceUnitPeriods.some(
         (period) => period.startDate && period.endDate && period.startDate > period.endDate,
      );

      if (hasOrgDateOrderError || hasPeriodDateOrderError) {
         setOrgInfoSubmitAttempted(true);
         setHasAttemptedSave(true);
         return;
      }

      // TODO: 백엔드 준비되면 실제 저장 API 연동
      setIsDirty(false);
   };

   return (
      <div className="flex flex-col gap-4">
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
            <h2 className="text-lg font-bold text-gray-900">조직·과정 정보</h2>
            <div className="mt-3 grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[15px] font-semibold text-gray-900">
                     조직명 <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <input
                     type="text"
                     value={orgSettings.orgName}
                     onChange={(e) => updateField('orgName', e.target.value)}
                     className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
               </div>
               <div>
                  <label className="text-[15px] font-semibold text-gray-900">
                     과정명 <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <input
                     type="text"
                     value={orgSettings.courseName}
                     onChange={(e) => updateField('courseName', e.target.value)}
                     className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                  />
               </div>
               <div>
                  <label className="text-[15px] font-semibold text-gray-900">
                     부트캠프 시작일{' '}
                     <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <DatePicker
                     value={orgSettings.startDate}
                     onChange={(value) => updateField('startDate', value)}
                     className="mt-2"
                  />
               </div>
               <div>
                  <label className="text-[15px] font-semibold text-gray-900">
                     부트캠프 종료일{' '}
                     <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <DatePicker
                     value={orgSettings.endDate}
                     onChange={(value) => updateField('endDate', value)}
                     className="mt-2"
                  />
                  <p
                     className={`mt-1.5 text-xs text-brand-red ${
                        orgInfoDateError ? 'visible' : 'invisible'
                     }`}
                  >
                     종료일은 시작일보다 빠를 수 없습니다.
                  </p>
               </div>
            </div>
         </div>

         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
            <label className="text-[15px] font-semibold text-gray-900">
               출결 단위기간 기준 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
               각 단위기간의 시작일·종료일을 직접 지정합니다. 날짜가 겹치지 않도록 입력해주세요.
            </p>

            {orgSettings.attendanceUnitPeriods.length === 0 ? (
               <p className="mt-2 rounded-xs border border-dashed border-gray-300 px-4 py-3 text-center text-sm text-gray-400">
                  단위기간을 추가해주세요.
               </p>
            ) : (
               <div className="mt-3 flex flex-col gap-3">
                  {orgSettings.attendanceUnitPeriods.map((period, index) => (
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
                                    attendanceDateErrors[period.id] ? 'visible' : 'invisible'
                                 }`}
                              >
                                 종료일은 시작일보다 빠를 수 없습니다.
                              </p>
                           </div>
                        </div>
                     </div>
                  ))}
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

            <div className="mt-7">
               <p className="text-sm font-semibold text-gray-900">지각·조퇴·외출 환산 횟수</p>
               <div className="mt-2 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-gray-700">
                  지각·조퇴·외출 <span className="font-bold">3회</span> = 결석 1회로 환산{' '}
                  <span className="text-xs text-[#9CA3AF]">(규정집 고정값)</span>
               </div>
            </div>

            <div className="mt-4 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
               <p className="text-sm font-semibold text-gray-900">적용 규정</p>
               <p className="mt-0.5 text-sm text-gray-700">
                  내일배움카드 부트캠프 기준 (지각·조퇴 3회 = 결석 1회 환산, 출석률 80% 미만 시 수료
                  불인정)
               </p>
            </div>
         </div>

         <div className="flex justify-end">
            <button
               type="button"
               disabled={!isSaveEnabled}
               onClick={handleSave}
               className={`rounded-sm px-5 py-2 text-sm font-semibold transition-colors ${
                  isSaveEnabled
                     ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               저장
            </button>
         </div>
      </div>
   );
}
