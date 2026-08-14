'use client';

import Pagination from '@/components/ui/Pagination';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import StaffConsultationRow from '../components/StaffConsultationRow';
import {
   HISTORY_PAGE_SIZE,
   useStaffCounselingHistory,
   type ConsultationStatusFilter,
   type CounselorRoleFilter,
} from '../hooks/useStaffCounselingHistory';

const ROLE_FILTER_OPTIONS: Array<{ value: CounselorRoleFilter; label: string }> = [
   { value: 'ALL', label: '전체' },
   { value: 'INSTRUCTOR', label: '강사' },
   { value: 'MANAGER', label: '매니저' },
];

const STATUS_FILTER_OPTIONS: Array<{ value: ConsultationStatusFilter; label: string }> = [
   { value: 'ALL', label: '전체' },
   { value: 'PENDING', label: '예정' },
   { value: 'COMPLETED', label: '완료' },
   { value: 'CANCELLED', label: '취소' },
];

// 운영진 "상담 이력 조회" 탭
export default function StaffHistoryTab() {
   const {
      upcoming,
      pagedUpcoming,
      upcomingPage,
      setUpcomingPage,
      upcomingTotalPages,
      isLoadingUpcoming,
      hasUpcomingError,
      history,
      pagedHistory,
      historyPage,
      setHistoryPage,
      historyTotalPages,
      isLoadingHistory,
      hasHistoryError,
      roleFilter,
      setRoleFilter,
      statusFilter,
      setStatusFilter,
   } = useStaffCounselingHistory();

   const handleRoleFilterChange = (value: CounselorRoleFilter | null) => {
      if (!value) return;
      setRoleFilter(value);
   };

   const handleStatusFilterChange = (value: ConsultationStatusFilter | null) => {
      if (!value) return;
      setStatusFilter(value);
   };

   return (
      <div className="flex flex-col">
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
               다가오는 상담 — {upcoming.length}건
            </h3>
            {isLoadingUpcoming ? (
               <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
            ) : hasUpcomingError ? (
               <p className="py-10 text-center text-sm text-brand-red">
                  다가오는 상담을 불러오지 못했습니다.
               </p>
            ) : upcoming.length === 0 ? (
               <p className="py-10 text-center text-sm text-gray-400">다가오는 상담이 없습니다.</p>
            ) : (
               <>
                  <div className="mt-3 flex flex-col gap-2">
                     {pagedUpcoming.map((item) => (
                        <StaffConsultationRow key={item.consultationId} item={item} variant="card" />
                     ))}
                  </div>
                  <div className="mt-3">
                     <Pagination
                        currentPage={upcomingPage}
                        totalPages={upcomingTotalPages}
                        onPageChange={setUpcomingPage}
                     />
                  </div>
               </>
            )}
         </div>

         <div className="flex items-center mt-6 gap-2">
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
               <SelectTrigger className="data-[size=default]:h-10 rounded-xs bg-white">
                  <SelectValue placeholder="담당자">
                     {(value: CounselorRoleFilter | null) =>
                        ROLE_FILTER_OPTIONS.find((option) => option.value === value)?.label ??
                        '담당자'
                     }
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  {ROLE_FILTER_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
               <SelectTrigger className="data-[size=default]:h-10 rounded-xs bg-white">
                  <SelectValue placeholder="상태">
                     {(value: ConsultationStatusFilter | null) =>
                        STATUS_FILTER_OPTIONS.find((option) => option.value === value)?.label ??
                        '상태'
                     }
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  {STATUS_FILTER_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="overflow-hidden rounded-sm mt-3 border border-[#E5E7EB] bg-white">
            <div className="flex items-center justify-between border-b bg-[#F9FAFB] border-[#E5E7EB] px-6 py-3">
               <h3 className="text-[13px] text-[#6B7280]">전체 상담 이력</h3>
               <span className="text-sm text-gray-400">{history.length}건</span>
            </div>
            {isLoadingHistory ? (
               <p className="py-10 text-center text-sm text-gray-400">불러오는 중...</p>
            ) : hasHistoryError ? (
               <p className="py-10 text-center text-sm text-brand-red">
                  상담 이력을 불러오지 못했습니다.
               </p>
            ) : history.length === 0 ? (
               <p className="py-10 text-center text-sm text-gray-400">상담 이력이 없습니다.</p>
            ) : (
               <>
                  <div className="divide-y divide-[#F3F4F6]">
                     {pagedHistory.map((item, index) => (
                        <StaffConsultationRow
                           key={item.consultationId}
                           item={item}
                           index={(historyPage - 1) * HISTORY_PAGE_SIZE + index + 1}
                           showCounselorName
                        />
                     ))}
                  </div>
                  <div className="border-t border-[#F3F4F6] px-6 py-3">
                     <Pagination
                        currentPage={historyPage}
                        totalPages={historyTotalPages}
                        onPageChange={setHistoryPage}
                     />
                  </div>
               </>
            )}
         </div>
      </div>
   );
}
