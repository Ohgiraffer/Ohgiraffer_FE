'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useAttendanceOverview } from '../../hooks/useAttendanceOverview';
import { useStudentDirectory } from '../../hooks/useStudentDirectory';
import AttendanceDetailTab from './AttendanceDetailTab';
import ApprovalDetailTab from './ApprovalDetailTab';
import TeamDetailTab from './TeamDetailTab';
import ConsultationDetailTab from './ConsultationDetailTab';
import SubmissionDetailTab from './SubmissionDetailTab';

type TabKey = 'attendance' | 'approval' | 'team' | 'consultation' | 'submission';

const TABS: Array<{ key: TabKey; label: string }> = [
   { key: 'attendance', label: '출결' },
   { key: 'approval', label: '결재' },
   { key: 'team', label: '팀' },
   { key: 'consultation', label: '상담' },
   { key: 'submission', label: '제출' },
];

interface TraineeDetailClientProps {
   traineeId: string;
}

// 훈련생 관리 상세 - 운영진이 목록에서 특정 훈련생을 눌렀을 때의 화면. 출결/결재/팀/상담/제출
// 탭 모두 각자의 API로 조회한다
export default function TraineeDetailClient({ traineeId }: TraineeDetailClientProps) {
   const [activeTab, setActiveTab] = useState<TabKey>('attendance');
   const numericTraineeId = Number(traineeId);

   const {
      students,
      isLoading: isLoadingDirectory,
      error: directoryError,
      retry: retryDirectory,
   } = useStudentDirectory();
   const {
      overview,
      isLoadingOverview,
      overviewError,
      retryOverview,
      currentDate,
      setCurrentDate,
      records,
      recordsError,
   } = useAttendanceOverview(numericTraineeId);

   const student = students?.find((candidate) => candidate.userId === numericTraineeId) ?? null;

   const isLoading = isLoadingDirectory || isLoadingOverview;
   const hasError = directoryError || overviewError;

   const backLink = (
      <Link href="/tracker" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
         <ChevronLeft size={16} />
         목록으로
      </Link>
   );

   if (isLoading) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            {backLink}
            <p className="mt-10 text-center text-sm text-gray-400">불러오는 중...</p>
         </div>
      );
   }

   if (hasError) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            {backLink}
            <div className="mt-10 flex flex-col items-center gap-3">
               <p className="text-sm text-gray-400">훈련생 정보를 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={() => {
                     retryDirectory();
                     retryOverview();
                  }}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         </div>
      );
   }

   if (!student || !overview) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            {backLink}
            <p className="mt-10 text-center text-sm text-gray-400">훈련생을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         {backLink}

         <div className="mt-3 flex items-center gap-3 rounded-sm border border-gray-200 bg-white px-6 py-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base font-semibold text-gray-600">
               {student.name.charAt(0)}
            </span>
            <div>
               <p className="text-base font-bold text-gray-900">
                  {student.name}
                  {student.teamName && (
                     <span className="ml-2 text-sm font-normal text-gray-400">{student.teamName}</span>
                  )}
               </p>
               <p className="mt-0.5 text-sm text-gray-400">
                  전체 출석률 <span className="font-semibold text-gray-700">{overview.attendanceRate}%</span> · 잔여
                  휴가 <span className="font-semibold text-gray-700">{overview.remainingVacation}회</span> · 잔여
                  병결 <span className="font-semibold text-gray-700">{overview.remainingSickLeave}회</span>
               </p>
            </div>
         </div>

         <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
            {TABS.map((tab) => (
               <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`cursor-pointer border-b-2 pb-3 text-sm transition-colors ${
                     activeTab === tab.key
                        ? 'border-brand-green font-bold text-[#111827]'
                        : 'border-transparent font-medium text-[#9CA3AF] hover:text-gray-700'
                  }`}
               >
                  {tab.label}
               </button>
            ))}
         </div>

         <div className="mt-5">
            {activeTab === 'attendance' && (
               <AttendanceDetailTab
                  overview={overview}
                  currentDate={currentDate}
                  onMonthChange={setCurrentDate}
                  records={records}
                  recordsError={recordsError}
               />
            )}
            {activeTab === 'approval' && <ApprovalDetailTab traineeId={numericTraineeId} />}
            {activeTab === 'team' && <TeamDetailTab traineeId={numericTraineeId} />}
            {activeTab === 'consultation' && <ConsultationDetailTab traineeId={numericTraineeId} />}
            {activeTab === 'submission' && <SubmissionDetailTab traineeId={numericTraineeId} />}
         </div>
      </div>
   );
}
