'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import Pagination from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useManagerTrackerData } from '../hooks/useManagerTrackerData';
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
   { label: '전체 훈련생', valueKey: 'totalStudents', suffix: '명', caption: '등록 기준' },
   { label: '진행 훈련생', valueKey: 'activeStudents', suffix: '명', caption: '정상 진행 중' },
   { label: '관리 대상', valueKey: 'managedStudents', suffix: '명', caption: '주의 이상' },
   { label: '위기 훈련생', valueKey: 'atRiskStudents', suffix: '명', caption: '경고·제적위험' },
   { label: '중도 이탈', valueKey: 'dropoutStudents', suffix: '명', caption: '수강 철회' },
] as const;

export default function StatusTab() {
   const router = useRouter();
   const {
      stats,
      trainees,
      periods,
      isLoading,
      error,
      retry,
      trend,
      isLoadingTrend,
      trendError,
      selectedPeriodId,
      changePeriod,
      retryTrend,
   } = useManagerTrackerData();
   const [riskFilter, setRiskFilter] = useState<TraineeRiskStatus | ''>('');
   const [dangerOnly, setDangerOnly] = useState<'ALL' | 'AT_RISK'>('ALL');
   const [teamFilter, setTeamFilter] = useState('ALL');
   const [searchText, setSearchText] = useState('');
   const [currentPage, setCurrentPage] = useState(1);

   const teamOptions = useMemo(
      () =>
         Array.from(
            new Set(trainees.map((trainee) => trainee.teamName).filter((name): name is string => !!name)),
         ),
      [trainees],
   );

   const filteredTrainees = useMemo(() => {
      return trainees.filter((trainee) => {
         if (riskFilter && trainee.riskStatus !== riskFilter) return false;
         if (dangerOnly === 'AT_RISK' && trainee.riskStatus === 'NORMAL') return false;
         if (teamFilter !== 'ALL' && trainee.teamName !== teamFilter) return false;
         if (searchText.trim() && !trainee.name.includes(searchText.trim())) return false;
         return true;
      });
   }, [trainees, riskFilter, dangerOnly, teamFilter, searchText]);

   const totalPages = Math.max(1, Math.ceil(filteredTrainees.length / PAGE_SIZE));
   const pagedTrainees = filteredTrainees.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
   );

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (error || !stats) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">현황 정보를 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={retry}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }

   return (
      <div>
         <div className="grid grid-cols-7 divide-x divide-gray-100 rounded-sm border border-gray-200 bg-white">
            {OVERVIEW_STATS.map((stat) => (
               <div key={stat.label} className="flex flex-col items-center gap-1 py-4">
                  <span className="text-xs text-gray-400">{stat.label}</span>
                  <span className="text-xl font-bold text-gray-900">
                     {stats[stat.valueKey]}
                     {stat.suffix}
                  </span>
                  <span className="text-[11px] text-gray-400">{stat.caption}</span>
               </div>
            ))}
         </div>

         <div className="mt-6 rounded-sm border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
               <p className="text-sm font-bold text-gray-900">출석 추이</p>
               <Select
                  value={selectedPeriodId != null ? String(selectedPeriodId) : ''}
                  onValueChange={(value) => changePeriod(value ? Number(value) : null)}
               >
                  <SelectTrigger className="h-9 w-35 rounded-xs bg-white">
                     <SelectValue placeholder="현재 단위기간">
                        {(value: string | null) => {
                           const period = value
                              ? periods.find((candidate) => String(candidate.id) === value)
                              : undefined;
                           return period ? `${period.periodNo}단위` : '현재 단위기간';
                        }}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="end" sideOffset={4}>
                     {periods.map((period) => (
                        <SelectItem key={period.id} value={String(period.id)}>
                           {period.periodNo}단위
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
            {isLoadingTrend ? (
               <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
            ) : trendError ? (
               <div className="flex flex-col items-center gap-2 py-10">
                  <p className="text-sm text-gray-400">출석 추이를 불러오지 못했습니다.</p>
                  <button
                     type="button"
                     onClick={retryTrend}
                     className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                     다시 시도
                  </button>
               </div>
            ) : (
               <AttendanceTrendChart data={trend} />
            )}
         </div>

         <div className="mt-6 flex flex-wrap items-center gap-2">
            <Select
               value={riskFilter}
               onValueChange={(value) => {
                  setRiskFilter((value as TraineeRiskStatus) ?? '');
                  setCurrentPage(1);
               }}
            >
               <SelectTrigger className="h-9 w-32 rounded-xs bg-white">
                  <SelectValue placeholder="출결 상태">
                     {(value: string | null) =>
                        RISK_FILTER_OPTIONS.find((option) => option.value === value)?.label ?? '출결 상태'
                     }
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
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
               <SelectTrigger className="h-9 w-32 rounded-xs bg-white">
                  <SelectValue placeholder="위험여부">
                     {(value: string | null) => (value === 'AT_RISK' ? '위험군만' : '위험여부')}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="AT_RISK">위험군만</SelectItem>
               </SelectContent>
            </Select>

            <Select
               value={teamFilter}
               onValueChange={(value) => {
                  setTeamFilter(value ?? 'ALL');
                  setCurrentPage(1);
               }}
            >
               <SelectTrigger className="h-9 w-28 rounded-xs bg-white">
                  <SelectValue placeholder="팀 전체">
                     {(value: string | null) => (value === 'ALL' || !value ? '팀 전체' : value)}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  <SelectItem value="ALL">전체</SelectItem>
                  {teamOptions.map((teamName) => (
                     <SelectItem key={teamName} value={teamName}>
                        {teamName}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <SearchInput
               onSearch={(value) => {
                  setSearchText(value);
                  setCurrentPage(1);
               }}
               placeholder="훈련생 이름 검색"
               className="ml-auto w-64"
            />
         </div>

         <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[18%] px-6 py-3 font-medium">이름</th>
                     <th className="w-[10%] px-3 py-3 font-medium">팀</th>
                     <th className="w-[18%] px-3 py-3 font-medium text-center">출석율</th>
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
                     pagedTrainees.map((trainee, index) => (
                        <tr
                           key={`${trainee.name}-${index}`}
                           onClick={() => {
                              if (trainee.traineeId != null) router.push(`/tracker/${trainee.traineeId}`);
                           }}
                           className={
                              trainee.traineeId != null
                                 ? 'cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]'
                                 : 'border-b border-[#F3F4F6] last:border-b-0'
                           }
                        >
                           <td className="px-6 py-4 font-medium text-gray-900">{trainee.name}</td>
                           <td className="px-3 py-4 text-gray-700">{trainee.teamName ?? '-'}</td>
                           <td className="px-3 py-4">
                              <div className="flex items-center justify-center gap-2">
                                 <div className="h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-gray-100">
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
                              {trainee.traineeId != null && <ChevronRight size={16} />}
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
