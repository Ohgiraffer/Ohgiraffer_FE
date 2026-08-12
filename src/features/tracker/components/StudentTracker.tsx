'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, TriangleAlert } from 'lucide-react';
import { useAttendanceOverview } from '../hooks/useAttendanceOverview';
import { ATTENDANCE_DAY_STATUS_LABELS, ATTENDANCE_TARGET_RATE, RISK_WARNING_MESSAGES } from '../types';
import AttendanceStatRow from './AttendanceStatRow';
import MonthAttendanceCalendar from './MonthAttendanceCalendar';

type RateTab = 'month' | 'all';

// 훈련생 본인 화면 - "내 훈련 현황"
export default function StudentTracker() {
   const [rateTab, setRateTab] = useState<RateTab>('month');
   const {
      overview,
      isLoadingOverview,
      overviewError,
      retryOverview,
      currentDate,
      setCurrentDate,
      records,
   } = useAttendanceOverview();

   if (isLoadingOverview) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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
                  <p className="text-sm font-bold text-brand-maroon">경고 단계</p>
                  <p className="mt-0.5 text-sm text-brand-maroon/80">{warningMessage}</p>
               </div>
            </div>
         )}

         <div className="mt-5 grid grid-cols-[1fr_2fr] divide-x divide-gray-100 rounded-sm border border-gray-200 bg-white">
            <div className="p-6">
               <p className="text-sm text-gray-400">오늘 출결 상태</p>
               {overview.todayStatus ? (
                  <span className="mt-2 inline-block rounded-xs bg-[#EAF3EC] px-2.5 py-1 text-xs font-medium text-brand-green">
                     {ATTENDANCE_DAY_STATUS_LABELS[overview.todayStatus]}
                  </span>
               ) : (
                  <span className="mt-2 inline-block rounded-xs bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
                     출결 기록 없음
                  </span>
               )}
               <p className="mt-3 text-lg font-bold text-gray-900">
                  {overview.checkInTime ? `입실 ${overview.checkInTime.slice(0, 5)}` : '입실 기록 없음'}
               </p>
               <div className="mt-3 flex gap-2">
                  <span className="rounded-xs bg-gray-100 px-2 py-1 text-xs text-gray-600">
                     잔여 휴가 <span className="font-semibold text-gray-900">{overview.remainingVacation}회</span>
                  </span>
                  <span className="rounded-xs bg-gray-100 px-2 py-1 text-xs text-gray-600">
                     잔여 병결 <span className="font-semibold text-gray-900">{overview.remainingSickLeave}회</span>
                  </span>
               </div>
            </div>

            <div className="p-6">
               <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">현재 출석률</p>
                  <div className="flex gap-4 text-sm">
                     <button
                        type="button"
                        onClick={() => setRateTab('month')}
                        className={`cursor-pointer ${rateTab === 'month' ? 'font-bold text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                        이번 달
                     </button>
                     <button
                        type="button"
                        onClick={() => setRateTab('all')}
                        className={`cursor-pointer ${rateTab === 'all' ? 'font-bold text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                        전체
                     </button>
                  </div>
               </div>
               <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{overview.attendanceRate}%</span>
                  <span className="text-sm text-gray-400">목표 {ATTENDANCE_TARGET_RATE}%</span>
               </div>
               <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                     className="h-full rounded-full bg-brand-sage"
                     style={{ width: `${overview.attendanceRate}%` }}
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
            <MonthAttendanceCalendar
               currentDate={currentDate}
               onMonthChange={setCurrentDate}
               records={records}
            />
         </div>
      </div>
   );
}
