'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Search } from 'lucide-react';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { MOCK_ATTENDANCE_TREND, MOCK_TRAINEES, MOCK_TRAINING_OVERVIEW_STATS } from '../mockData';
import { TRAINEE_RISK_LABELS, TRAINEE_RISK_TONES, type TraineeRiskStatus } from '../types';
import AttendanceTrendChart from '../components/AttendanceTrendChart';

const PAGE_SIZE = 5;

const RISK_FILTER_OPTIONS: Array<{ value: TraineeRiskStatus; label: string }> = [
   { value: 'NORMAL', label: '정상' },
   { value: 'CAUTION', label: '주의' },
   { value: 'WARNING', label: '경고' },
   { value: 'EXPULSION_RISK', label: '제적위험' },
];

const OVERVIEW_STATS = [
   { label: '평균 출석률', valueKey: 'averageAttendanceRate', suffix: '%', caption: '전체 기준' },
   { label: '예상 수료율', valueKey: 'expectedCompletionRate', suffix: '%', caption: '진행 기준' },
   { label: '전체 훈련생', valueKey: 'totalTrainees', suffix: '명', caption: '등록 기준' },
   { label: '진행 훈련생', valueKey: 'activeTrainees', suffix: '명', caption: '정상 진행 중' },
   { label: '관리 대상', valueKey: 'managedTrainees', suffix: '명', caption: '주의 이상' },
   { label: '위기 훈련생', valueKey: 'atRiskTrainees', suffix: '명', caption: '경고·제적위험' },
   { label: '중도 이탈', valueKey: 'dropoutTrainees', suffix: '명', caption: '수강 철회' },
] as const;

export default function StatusTab() {
   const router = useRouter();
   const [riskFilter, setRiskFilter] = useState<TraineeRiskStatus | ''>('');
   const [dangerOnly, setDangerOnly] = useState<'ALL' | 'AT_RISK'>('ALL');
   const [classFilter, setClassFilter] = useState('ALL');
   const [searchText, setSearchText] = useState('');
   const [currentPage, setCurrentPage] = useState(1);

   const classOptions = useMemo(
      () => Array.from(new Set(MOCK_TRAINEES.map((trainee) => trainee.className))),
      [],
   );

   const filteredTrainees = useMemo(() => {
      return MOCK_TRAINEES.filter((trainee) => {
         if (riskFilter && trainee.riskStatus !== riskFilter) return false;
         if (dangerOnly === 'AT_RISK' && trainee.riskStatus === 'NORMAL') return false;
         if (classFilter !== 'ALL' && trainee.className !== classFilter) return false;
         if (searchText.trim() && !trainee.name.includes(searchText.trim())) return false;
         return true;
      });
   }, [riskFilter, dangerOnly, classFilter, searchText]);

   const totalPages = Math.max(1, Math.ceil(filteredTrainees.length / PAGE_SIZE));
   const pagedTrainees = filteredTrainees.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
   );

   return (
      <div>
         <div className="grid grid-cols-7 gap-4">
            {OVERVIEW_STATS.map((stat) => (
               <div key={stat.label}>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">
                     {MOCK_TRAINING_OVERVIEW_STATS[stat.valueKey]}
                     {stat.suffix}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{stat.caption}</p>
               </div>
            ))}
         </div>

         <div className="mt-6 rounded-sm border border-gray-200 bg-white p-6">
            <p className="text-sm font-bold text-gray-900">출석 추이</p>
            <AttendanceTrendChart data={MOCK_ATTENDANCE_TREND} />
         </div>

         <div className="mt-6 flex flex-wrap items-center gap-2">
            <Select
               value={riskFilter}
               onValueChange={(value) => {
                  setRiskFilter((value as TraineeRiskStatus) ?? '');
                  setCurrentPage(1);
               }}
            >
               <SelectTrigger className="h-9 w-32 rounded-xs">
                  <SelectValue placeholder="출결 상태">
                     {(value: string | null) =>
                        RISK_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? '출결 상태'
                     }
                  </SelectValue>
               </SelectTrigger>
               <SelectContent>
                  {RISK_FILTER_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value}>
                        {option.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <Select
               value={dangerOnly}
               onValueChange={(value) => {
                  setDangerOnly((value as 'ALL' | 'AT_RISK') ?? 'ALL');
                  setCurrentPage(1);
               }}
            >
               <SelectTrigger className="h-9 w-32 rounded-xs">
                  <SelectValue placeholder="위험 여부">
                     {(value: string | null) => (value === 'AT_RISK' ? '위험군만' : '전체')}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="AT_RISK">위험군만</SelectItem>
               </SelectContent>
            </Select>

            <Select
               value={classFilter}
               onValueChange={(value) => {
                  setClassFilter(value ?? 'ALL');
                  setCurrentPage(1);
               }}
            >
               <SelectTrigger className="h-9 w-28 rounded-xs">
                  <SelectValue placeholder="전체">
                     {(value: string | null) => (value === 'ALL' || !value ? '전체' : value)}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {classOptions.map((className) => (
                     <SelectItem key={className} value={className}>
                        {className}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <div className="relative ml-auto w-64">
               <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
               <input
                  value={searchText}
                  onChange={(e) => {
                     setSearchText(e.target.value);
                     setCurrentPage(1);
                  }}
                  placeholder="훈련생 이름 검색"
                  className="h-9 w-full rounded-xs border border-gray-200 bg-white pr-3 pl-8 text-sm text-gray-900 outline-none focus:border-gray-400"
               />
            </div>
         </div>

         <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[18%] px-6 py-3 font-medium">이름</th>
                     <th className="w-[10%] px-3 py-3 font-medium">반</th>
                     <th className="w-[18%] px-3 py-3 font-medium">출석율</th>
                     <th className="w-[10%] px-3 py-3 text-center font-medium">지각</th>
                     <th className="w-[10%] px-3 py-3 text-center font-medium">조퇴</th>
                     <th className="w-[10%] px-3 py-3 text-center font-medium">외출</th>
                     <th className="w-[10%] px-3 py-3 text-center font-medium">결석</th>
                     <th className="w-[10%] px-3 py-3 text-center font-medium">상태</th>
                     <th className="w-[4%] px-3 py-3" />
                  </tr>
               </thead>
               <tbody>
                  {pagedTrainees.length === 0 ? (
                     <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-gray-400">
                           조건에 맞는 훈련생이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     pagedTrainees.map((trainee) => (
                        <tr
                           key={trainee.traineeId}
                           onClick={() => router.push(`/tracker/${trainee.traineeId}`)}
                           className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                        >
                           <td className="px-6 py-4 font-medium text-gray-900">{trainee.name}</td>
                           <td className="px-3 py-4 text-gray-700">{trainee.className}</td>
                           <td className="px-3 py-4">
                              <div className="flex items-center gap-2">
                                 <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                    <div
                                       className="h-full rounded-full bg-brand-sage"
                                       style={{ width: `${trainee.attendanceRate}%` }}
                                    />
                                 </div>
                                 <span className="text-gray-700">{trainee.attendanceRate}%</span>
                              </div>
                           </td>
                           <td className="px-3 py-4 text-center text-gray-700">{trainee.lateCount}</td>
                           <td className="px-3 py-4 text-center text-gray-700">{trainee.earlyLeaveCount}</td>
                           <td className="px-3 py-4 text-center text-gray-700">{trainee.outingCount}</td>
                           <td className="px-3 py-4 text-center text-gray-700">{trainee.absentCount}</td>
                           <td className="px-3 py-4 text-center">
                              <StatusBadge tone={TRAINEE_RISK_TONES[trainee.riskStatus]}>
                                 {TRAINEE_RISK_LABELS[trainee.riskStatus]}
                              </StatusBadge>
                           </td>
                           <td className="px-3 py-4 text-right text-gray-300">
                              <ChevronRight size={16} />
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         <div className="mt-6">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
         </div>
      </div>
   );
}
