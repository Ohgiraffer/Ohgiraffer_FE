'use client';

import OrgInfoFields from '@/features/bootcamp-settings/components/OrgInfoFields';
import AttendanceUnitPeriodsFields from '@/features/bootcamp-settings/components/AttendanceUnitPeriodsFields';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { useOrgAttendanceSettings } from '../hooks/useOrgAttendanceSettings';

function OrgAttendanceApprovalTabSkeleton() {
   return (
      <div className="flex flex-col gap-4">
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
            <Skeleton width={120} height={20} className="rounded-md" />
            <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
               {[0, 1, 2, 3].map((i) => (
                  <div key={i}>
                     <Skeleton width={100} height={16} className="rounded-md" />
                     <Skeleton width="100%" height={42} className="mt-2 rounded-sm" />
                  </div>
               ))}
            </div>
         </div>

         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
            <Skeleton width={160} height={18} className="rounded-md" />
            <Skeleton width={360} height={14} className="mt-2 rounded-md" />

            <div className="mt-2 flex flex-col gap-3">
               {[0, 1].map((i) => (
                  <div key={i} className="rounded-sm border border-gray-200 p-4">
                     <Skeleton width={72} height={14} className="rounded-md" />
                     <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                           <Skeleton width={48} height={13} className="rounded-md" />
                           <Skeleton width="100%" height={42} className="mt-1 rounded-sm" />
                        </div>
                        <div>
                           <Skeleton width={48} height={13} className="rounded-md" />
                           <Skeleton width="100%" height={42} className="mt-1 rounded-sm" />
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <Skeleton width="100%" height={44} className="mt-3 rounded-xs" />

            <div className="mt-7">
               <Skeleton width={140} height={14} className="rounded-md" />
               <Skeleton width="100%" height={44} className="mt-2 rounded-xs" />
            </div>

            <Skeleton width="100%" height={56} className="mt-4 rounded-xs" />
         </div>

         <div className="flex justify-end">
            <Skeleton width={80} height={40} className="rounded-sm" />
         </div>
      </div>
   );
}

export default function OrgAttendanceApprovalTab() {
   const {
      isLoading,
      loadError,
      orgInfo,
      updateOrgInfo,
      periods,
      updatePeriods,
      orgInfoDateError,
      periodErrors,
      isSaveEnabled,
      isSaving,
      handleSave,
   } = useOrgAttendanceSettings();

   if (isLoading) {
      return <OrgAttendanceApprovalTabSkeleton />;
   }

   if (loadError) {
      return (
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10 text-center text-sm text-brand-red">
            {loadError}
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-4">
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
            <h2 className="text-lg font-bold text-gray-900">조직·과정 정보</h2>
            <div className="mt-3">
               <OrgInfoFields
                  value={orgInfo}
                  onChange={updateOrgInfo}
                  dateOrderError={orgInfoDateError}
               />
            </div>
         </div>

         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-6">
            <label className="text-[15px] font-semibold text-gray-900">
               출결 단위기간 기준 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <p className="mt-0.5 text-[12px] text-[#9CA3AF]">
               각 단위기간의 시작일·종료일을 직접 지정합니다. 부트캠프 기간을 벗어나거나 서로 겹치지
               않도록 입력해주세요.
            </p>

            <AttendanceUnitPeriodsFields
               periods={periods}
               onChange={updatePeriods}
               periodErrors={periodErrors}
            />

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
               className={`cursor-pointer rounded-sm px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isSaveEnabled
                     ? 'bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               {isSaving ? '저장 중...' : '저장'}
            </button>
         </div>
      </div>
   );
}
