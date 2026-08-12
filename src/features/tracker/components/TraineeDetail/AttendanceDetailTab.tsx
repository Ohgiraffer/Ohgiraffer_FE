'use client';

import { useState } from 'react';
import {
   ATTENDANCE_STATUS_COLOR_GROUP,
   ATTENDANCE_STATUS_LABELS,
   type AttendanceColorGroup,
   type TraineeDetail,
} from '../../types';
import AttendanceStatRow from '../AttendanceStatRow';
import MonthAttendanceCalendar from '../MonthAttendanceCalendar';

const UNIT_PERIODS = ['전체', '1단위', '2단위', '3단위'] as const;

const STATUS_TEXT_CLASSES: Record<AttendanceColorGroup, string> = {
   green: 'text-brand-green',
   pink: 'text-brand-red',
   red: 'text-brand-maroon',
};

export default function AttendanceDetailTab({ detail }: { detail: TraineeDetail }) {
   const [unitPeriod, setUnitPeriod] = useState<(typeof UNIT_PERIODS)[number]>('전체');
   const sortedRecords = [...detail.records].sort((a, b) => b.date.localeCompare(a.date));

   return (
      <div>
         <div className="flex items-center justify-between">
            <div>
               <p className="text-sm text-gray-400">현재 출석률</p>
               <p className="mt-1 text-2xl font-bold text-gray-900">
                  {detail.attendanceRate}%{' '}
                  <span className="text-sm font-normal text-gray-400">목표 90%</span>
               </p>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-sm text-gray-400">단위기간</span>
               <div className="flex rounded-xs border border-gray-200 bg-white p-0.5">
                  {UNIT_PERIODS.map((period) => (
                     <button
                        key={period}
                        type="button"
                        onClick={() => setUnitPeriod(period)}
                        className={`cursor-pointer rounded-xs px-3 py-1.5 text-xs font-medium transition-colors ${
                           unitPeriod === period
                              ? 'bg-brand-green text-white'
                              : 'text-gray-500 hover:text-gray-700'
                        }`}
                     >
                        {period}
                     </button>
                  ))}
               </div>
            </div>
         </div>
         <p className="mt-1 text-xs text-gray-400">
            잔여 휴가 <span className="font-semibold text-gray-700">{detail.remainingVacation}회</span> · 잔여
            병결 <span className="font-semibold text-gray-700">{detail.remainingSickLeave}회</span>
         </p>

         <div className="mt-5">
            <AttendanceStatRow
               present={detail.present}
               late={detail.late}
               earlyLeave={detail.earlyLeave}
               outing={detail.outing}
               absent={detail.absent}
               vacation={detail.vacation}
               sickLeave={detail.sickLeave}
               presentUnit="일"
               absentUnit="일"
            />
         </div>

         <div className="mt-5 rounded-sm border border-gray-200 bg-white p-6">
            <MonthAttendanceCalendar records={detail.records} initialDate={new Date(2025, 6, 1)} />
         </div>

         <div className="mt-5">
            <p className="text-sm font-bold text-gray-900">상세 출결 기록 (최신순)</p>
            <div className="mt-3 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
               <table className="w-full table-fixed text-left text-sm">
                  <thead>
                     <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                        <th className="w-[20%] px-6 py-3 font-medium">날짜</th>
                        <th className="w-[15%] px-3 py-3 font-medium">상태</th>
                        <th className="w-[30%] px-3 py-3 font-medium">시간</th>
                        <th className="w-[35%] px-3 py-3 font-medium">비고</th>
                     </tr>
                  </thead>
                  <tbody>
                     {sortedRecords.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                              출결 기록이 없습니다.
                           </td>
                        </tr>
                     ) : (
                        sortedRecords.map((record) => (
                           <tr key={record.date} className="border-b border-[#F3F4F6] last:border-b-0">
                              <td className="px-6 py-4 text-gray-700">{record.date.slice(5).replace('-', '/')}</td>
                              <td className="px-3 py-4">
                                 <span
                                    className={`font-semibold ${STATUS_TEXT_CLASSES[ATTENDANCE_STATUS_COLOR_GROUP[record.status]]}`}
                                 >
                                    {ATTENDANCE_STATUS_LABELS[record.status]}
                                 </span>
                              </td>
                              <td className="px-3 py-4 text-gray-700">
                                 {record.checkIn ? `${record.checkIn} ~ ${record.checkOut ?? ''}` : '—'}
                              </td>
                              <td className="px-3 py-4 text-gray-500">{record.note ?? '—'}</td>
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
