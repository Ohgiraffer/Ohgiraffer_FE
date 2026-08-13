'use client';

import { useState } from 'react';
import {
   ATTENDANCE_DAY_STATUS_COLOR_GROUP,
   ATTENDANCE_DAY_STATUS_LABELS,
   ATTENDANCE_TARGET_RATE,
   type AttendanceColorGroup,
   type AttendanceDayRecord,
   type AttendanceDayStatus,
   type StudentAttendanceOverview,
} from '../../types';
import AttendanceStatRow from '../AttendanceStatRow';
import MonthAttendanceCalendar from '../MonthAttendanceCalendar';

const STATUS_TEXT_CLASSES: Record<AttendanceColorGroup, string> = {
   green: 'text-brand-green',
   pink: 'text-brand-red',
   red: 'text-brand-maroon',
};

interface AttendanceDetailTabProps {
   overview: StudentAttendanceOverview;
   currentDate: Date;
   onMonthChange: (date: Date) => void;
   records: AttendanceDayRecord[];
   recordsError: boolean;
}

export default function AttendanceDetailTab({
   overview,
   currentDate,
   onMonthChange,
   records,
   recordsError,
}: AttendanceDetailTabProps) {
   // '전체'면 전체 출석률, 그 외엔 periodRates 중 해당 단위기간의 출석률을 보여준다
   const [unitPeriod, setUnitPeriod] = useState<'전체' | number>('전체');

   const displayedRate =
      unitPeriod === '전체'
         ? overview.attendanceRate
         : overview.periodRates.find((rate) => rate.periodNo === unitPeriod)?.attendanceRate ??
           overview.attendanceRate;

   // 기록이 없는 날(status: null)은 목록에서 제외 - 실제 출결 이벤트가 있었던 날만 보여준다
   const sortedRecords = records
      .filter(
         (record): record is typeof record & { status: AttendanceDayStatus } => record.status !== null,
      )
      .sort((a, b) => b.date.localeCompare(a.date));

   return (
      <div>
         <div className="grid grid-cols-[auto_1fr] rounded-sm border border-gray-200 bg-white">
            <div className="p-6">
               <p className="text-sm text-gray-400">단위기간</p>
               <div className="mt-2 flex w-fit rounded-xs border border-gray-200 bg-white p-0.5">
                  <button
                     type="button"
                     onClick={() => setUnitPeriod('전체')}
                     className={`cursor-pointer rounded-xs px-3 py-1.5 text-xs font-medium transition-colors ${
                        unitPeriod === '전체'
                           ? 'bg-brand-green text-white'
                           : 'text-gray-500 hover:text-gray-700'
                     }`}
                  >
                     전체
                  </button>
                  {overview.periodRates.map((rate) => (
                     <button
                        key={rate.periodNo}
                        type="button"
                        onClick={() => setUnitPeriod(rate.periodNo)}
                        className={`cursor-pointer rounded-xs px-3 py-1.5 text-xs font-medium transition-colors ${
                           unitPeriod === rate.periodNo
                              ? 'bg-brand-green text-white'
                              : 'text-gray-500 hover:text-gray-700'
                        }`}
                     >
                        {rate.periodNo}단위
                     </button>
                  ))}
               </div>
               <p className="mt-3 text-xs text-gray-400">
                  잔여 휴가 <span className="font-semibold text-gray-700">{overview.remainingVacation}회</span> ·
                  잔여 병결 <span className="font-semibold text-gray-700">{overview.remainingSickLeave}회</span>
               </p>
            </div>

            <div className="relative p-6">
               <div className="absolute inset-y-6 left-0 w-px bg-gray-100" />
               <p className="text-sm text-gray-400">현재 출석률</p>
               <p className="mt-1 text-2xl font-bold text-gray-900">
                  {displayedRate}%{' '}
                  <span className="text-sm font-normal text-gray-400">목표 {ATTENDANCE_TARGET_RATE}%</span>
               </p>
               <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-brand-sage" style={{ width: `${displayedRate}%` }} />
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
               <p className="py-10 text-center text-sm text-gray-400">달력 정보를 불러오지 못했습니다.</p>
            ) : (
               <MonthAttendanceCalendar currentDate={currentDate} onMonthChange={onMonthChange} records={records} />
            )}
         </div>

         <div className="mt-5">
            <p className="text-sm font-bold text-gray-900">상세 출결 기록 (최신순)</p>
            <div className="mt-3 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
               <table className="w-full table-fixed text-left text-sm">
                  <thead>
                     <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                        <th className="w-[35%] px-6 py-3 font-medium">날짜</th>
                        <th className="w-[30%] px-3 py-3 text-center font-medium">상태</th>
                        <th className="w-[35%] px-3 py-3 text-center font-medium">시간</th>
                     </tr>
                  </thead>
                  <tbody>
                     {sortedRecords.length === 0 ? (
                        <tr>
                           <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                              출결 기록이 없습니다.
                           </td>
                        </tr>
                     ) : (
                        sortedRecords.map((record) => (
                           <tr key={record.date} className="border-b border-[#F3F4F6] last:border-b-0">
                              <td className="px-6 py-4 text-gray-700">{record.date.slice(5).replace('-', '/')}</td>
                              <td className="px-3 py-4 text-center">
                                 <span
                                    className={`font-semibold ${STATUS_TEXT_CLASSES[ATTENDANCE_DAY_STATUS_COLOR_GROUP[record.status]]}`}
                                 >
                                    {ATTENDANCE_DAY_STATUS_LABELS[record.status]}
                                 </span>
                              </td>
                              <td className="px-3 py-4 text-center text-gray-700">
                                 {record.checkInTime
                                    ? `${record.checkInTime.slice(0, 5)} ~ ${
                                         record.checkOutTime ? record.checkOutTime.slice(0, 5) : '미퇴실'
                                      }`
                                    : '—'}
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
}
