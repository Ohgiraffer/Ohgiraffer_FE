'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getTraineeDetail } from '../../mockData';
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

// 훈련생 관리 상세 - 운영진이 목록에서 특정 훈련생을 눌렀을 때의 화면. 지금은 하드코딩된
// 목데이터로 디자인만 맞추고, API 연동은 이후 별도로 진행한다
export default function TraineeDetailClient({ traineeId }: TraineeDetailClientProps) {
   const [activeTab, setActiveTab] = useState<TabKey>('attendance');
   const detail = getTraineeDetail(Number(traineeId));

   if (!detail) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Link
               href="/tracker"
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
               <ChevronLeft size={16} />
               목록으로
            </Link>
            <p className="mt-10 text-center text-sm text-gray-400">훈련생을 찾을 수 없습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link href="/tracker" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft size={16} />
            목록으로
         </Link>

         <div className="mt-3 flex items-center gap-3 rounded-sm border border-gray-200 bg-white px-6 py-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base font-semibold text-gray-600">
               {detail.name.charAt(0)}
            </span>
            <div>
               <p className="text-base font-bold text-gray-900">{detail.name}</p>
               <p className="mt-0.5 text-sm text-gray-400">
                  전체 출석률 <span className="font-semibold text-gray-700">{detail.attendanceRate}%</span> · 잔여
                  휴가 <span className="font-semibold text-gray-700">{detail.remainingVacation}회</span> · 잔여
                  병결 <span className="font-semibold text-gray-700">{detail.remainingSickLeave}회</span>
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
            {activeTab === 'attendance' && <AttendanceDetailTab detail={detail} />}
            {activeTab === 'approval' && <ApprovalDetailTab approvals={detail.approvals} />}
            {activeTab === 'team' && <TeamDetailTab teams={detail.teams} />}
            {activeTab === 'consultation' && <ConsultationDetailTab consultations={detail.consultations} />}
            {activeTab === 'submission' && <SubmissionDetailTab submissions={detail.submissions} />}
         </div>
      </div>
   );
}
