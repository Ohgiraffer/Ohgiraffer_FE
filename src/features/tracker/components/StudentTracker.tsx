'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, TriangleAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { useAttendanceOverview } from '../hooks/useAttendanceOverview';
import {
   ATTENDANCE_DAY_STATUS_COLOR_GROUP,
   ATTENDANCE_DAY_STATUS_LABELS,
   ATTENDANCE_TARGET_RATE,
   RISK_WARNING_MESSAGES,
   TRAINEE_RISK_LABELS,
   type AttendanceColorGroup,
} from '../types';
import AttendanceStatRow from './AttendanceStatRow';
import MonthAttendanceCalendar from './MonthAttendanceCalendar';
import type { ServerStudentTrackerData } from '../getServerStudentTrackerData';

// 오늘 출결 상태 배지 색상 - 달력 범례와 같은 규칙(정상 초록 / 지각·조퇴·외출 분홍 / 결석 빨강)
const TODAY_STATUS_BADGE_CLASSES: Record<AttendanceColorGroup, string> = {
   green: 'bg-[#EAF3EC] text-brand-green',
   pink: 'bg-brand-red/10 text-brand-red',
   red: 'bg-brand-maroon/10 text-brand-maroon',
};

// 출석률 필터 - 'ALL'이면 전체 기간, 숫자면 그 단위기간(periodNo)만
type RateFilter = 'ALL' | number;

interface StudentTrackerProps {
   initialData?: ServerStudentTrackerData;
}

// 훈련생 본인 화면 - "내 훈련 현황"
export default function StudentTracker({ initialData }: StudentTrackerProps) {
   const [rateFilter, setRateFilter] = useState<RateFilter>('ALL');
   const {
      overview,
      isLoadingOverview,
      overviewError,
      retryOverview,
      currentDate,
      setCurrentDate,
      records,
      isLoadingRecords,
      recordsError,
   } = useAttendanceOverview(undefined, initialData);

   if (isLoadingOverview) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="flex items-center justify-between">
               <Skeleton width={140} height={28} className="rounded-md" />
               <Skeleton width={110} height={38} className="rounded-xs" />
            </div>

            <div className="mt-5 grid grid-cols-1 divide-y divide-gray-100 rounded-sm border border-gray-200 bg-white sm:grid-cols-[1fr_2fr] sm:divide-x sm:divide-y-0">
               <div className="p-6">
                  <Skeleton width={90} height={13} className="rounded-md" />
                  <Skeleton width={70} height={24} className="mt-2 rounded-xs" />
                  <Skeleton width={120} height={22} className="mt-3 rounded-md" />
                  <div className="mt-3 flex gap-2">
                     <Skeleton width={90} height={24} className="rounded-xs" />
                     <Skeleton width={90} height={24} className="rounded-xs" />
                  </div>
               </div>
               <div className="min-w-0 p-6">
                  <Skeleton width={90} height={13} className="rounded-md" />
                  <Skeleton width={90} height={28} className="mt-2 rounded-xs" />
                  <Skeleton width="100%" height={8} className="mt-4 rounded-full" />
               </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-gray-200 bg-gray-100 sm:grid-cols-4 lg:grid-cols-7">
               {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white p-3">
                     <Skeleton width="100%" height={40} className="rounded-md" />
                  </div>
               ))}
            </div>

            <div className="mt-5 rounded-sm border border-gray-200 bg-white p-6">
               <Skeleton width="100%" height={320} className="rounded-md" />
            </div>
         </div>
      );
   }

   if (overviewError || !overview) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">출결 정보를 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={retryOverview}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         </div>
      );
   }

   const warningMessage =
      overview.riskStatus === 'NORMAL' ? null : RISK_WARNING_MESSAGES[overview.riskStatus];

   const displayedRate =
      rateFilter === 'ALL'
         ? overview.attendanceRate
         : (overview.periodRates.find((period) => period.periodNo === rateFilter)?.attendanceRate ??
           overview.attendanceRate);

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">내 훈련 현황</h1>
            <Link
               href="/approvals?tab=apply"
               className="flex items-center gap-1.5 rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A]"
            >
               <Plus size={14} />
               휴가 신청
            </Link>
         </div>

         {warningMessage && (
            <div className="mt-5 flex items-start gap-3 rounded-sm border border-[#F0C9C2] bg-[#FBEEEC] px-5 py-4">
               <TriangleAlert size={20} className="mt-0.5 shrink-0 text-brand-maroon" />
               <div>
                  <p className="text-sm font-bold text-brand-maroon">
                     {TRAINEE_RISK_LABELS[overview.riskStatus]} 단계
                  </p>
                  <p className="mt-0.5 text-sm text-brand-maroon/80">{warningMessage}</p>
               </div>
            </div>
         )}

         <div className="mt-5 grid grid-cols-1 divide-y divide-gray-100 rounded-sm border border-gray-200 bg-white sm:grid-cols-[1fr_2fr] sm:divide-x sm:divide-y-0">
            <div className="p-6">
               <p className="text-sm text-gray-400">오늘 출결 상태</p>
               {/* todayStatus/checkInTime은 overview와 달리 프리페치 대상이 아니라 월별 기록
                  조회(isLoadingRecords)가 끝나야 채워진다 - 그 전에 미리 "기록 없음"을 보여주면
                  실제로 이미 출결했는데도 잠깐 잘못된 정보가 보인다 */}
               {isLoadingRecords ? (
                  <Skeleton width={90} height={24} className="mt-2 rounded-xs" />
               ) : overview.todayStatus ? (
                  <span
                     className={`mt-2 inline-block rounded-xs px-2.5 py-1 text-xs font-medium ${
                        TODAY_STATUS_BADGE_CLASSES[
                           ATTENDANCE_DAY_STATUS_COLOR_GROUP[overview.todayStatus]
                        ]
                     }`}
                  >
                     {ATTENDANCE_DAY_STATUS_LABELS[overview.todayStatus]}
                  </span>
               ) : (
                  <span className="mt-2 inline-block rounded-xs bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
                     출결 기록 없음
                  </span>
               )}
               <p className="mt-3 text-lg font-bold text-gray-900">
                  {isLoadingRecords ? (
                     <Skeleton width={120} height={22} className="rounded-md" />
                  ) : overview.checkInTime ? (
                     `입실 ${overview.checkInTime.slice(0, 5)}`
                  ) : (
                     '입실 기록 없음'
                  )}
               </p>
               <div className="mt-3 flex gap-2">
                  <span className="rounded-xs bg-gray-100 px-2 py-1 text-xs text-gray-600">
                     잔여 휴가{' '}
                     <span className="font-semibold text-gray-900">
                        {overview.remainingVacation}회
                     </span>
                  </span>
                  <span className="rounded-xs bg-gray-100 px-2 py-1 text-xs text-gray-600">
                     잔여 병결{' '}
                     <span className="font-semibold text-gray-900">
                        {overview.remainingSickLeave}회
                     </span>
                  </span>
               </div>
            </div>

            <div className="min-w-0 p-6">
               <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-gray-400">현재 출석률</p>
                  <div className="flex flex-wrap items-center gap-1 rounded-xs border border-gray-200 p-1">
                     <button
                        type="button"
                        onClick={() => setRateFilter('ALL')}
                        className={`cursor-pointer rounded-xs px-2.5 py-1 text-xs font-medium transition-colors ${
                           rateFilter === 'ALL'
                              ? 'bg-brand-green text-white'
                              : 'text-gray-500 hover:text-gray-700'
                        }`}
                     >
                        전체
                     </button>
                     {overview.periodRates.map((period) => (
                        <button
                           key={period.periodNo}
                           type="button"
                           onClick={() => setRateFilter(period.periodNo)}
                           className={`cursor-pointer rounded-xs px-2.5 py-1 text-xs font-medium transition-colors ${
                              rateFilter === period.periodNo
                                 ? 'bg-brand-green text-white'
                                 : 'text-gray-500 hover:text-gray-700'
                           }`}
                        >
                           {period.periodNo}단위
                        </button>
                     ))}
                  </div>
               </div>
               <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{displayedRate}%</span>
                  <span className="text-sm text-gray-400">목표 {ATTENDANCE_TARGET_RATE}%</span>
               </div>
               <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                     className="h-full rounded-full bg-brand-sage"
                     style={{ width: `${displayedRate}%` }}
                  />
               </div>
            </div>
         </div>

         <div className="mt-5">
            <AttendanceStatRow
               present={overview.present}
               late={overview.late}
               earlyLeave={overview.earlyLeave}
               outing={overview.outing}
               absent={overview.absent}
               vacation={overview.vacation}
               sickLeave={overview.sickLeave}
               presentUnit="일"
               absentUnit="일"
            />
         </div>

         <div className="mt-5 rounded-sm border border-gray-200 bg-white p-6">
            {recordsError ? (
               <p className="py-10 text-center text-sm text-gray-400">
                  달력 정보를 불러오지 못했습니다.
               </p>
            ) : (
               <MonthAttendanceCalendar
                  currentDate={currentDate}
                  onMonthChange={setCurrentDate}
                  records={records}
               />
            )}
         </div>
      </div>
   );
}
