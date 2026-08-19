'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import AnimatedHeight from '@/components/ui/loading/AnimatedHeight';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import {
   getAttendanceDashboardSummary,
   getMyAttendanceSummary,
   type AttendanceDashboardSummary,
   type AttendanceSummaryResponse,
} from '@/services/attendance.service';
import { mapRiskLevel, TRAINEE_RISK_LABELS } from '@/features/tracker/types';

interface StatDot {
   label: string;
   value: string;
   colorClassName: string;
}

function CardShell({
   children,
   cardHeight,
}: {
   children: React.ReactNode;
   // 캘린더 높이의 절반으로 카드 높이를 고정한다. 아직 측정 전(undefined)이면 자연스러운 높이로 그린다
   cardHeight?: number;
}) {
   return (
      <div
         className="flex h-full flex-col rounded-sm border border-gray-200 bg-white p-6 lg:p-6"
         style={cardHeight ? { height: cardHeight } : undefined}
      >
         <div className="mb-4 flex shrink-0 items-center justify-between lg:mb-4">
            <h2 className="flex items-center gap-1.5 -ml-1 text-sm font-bold text-gray-900">
               <ClipboardCheck size={16} className="text-gray-400" />
               출결 현황
            </h2>
            <Link href="/tracker" className="text-xs text-gray-400 hover:text-gray-600">
               상세
            </Link>
         </div>
         {/* height는 헤더+패딩까지 포함한 카드 전체(바깥 div)에 고정으로 건다 - 안쪽 콘텐츠에만
            걸면 헤더/패딩만큼 카드 실제 높이가 캘린더 절반보다 더 커진다 */}
         <div className="min-h-0 flex-1">
            <AnimatedHeight>{children}</AnimatedHeight>
         </div>
      </div>
   );
}

function LoadingOrError({
   hasError,
   onRetry,
   rowCount,
}: {
   hasError: boolean;
   onRetry: () => void;
   rowCount: number;
}) {
   if (hasError) {
      return (
         <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-sm text-gray-400">출결 현황을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={onRetry}
               className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }
   return (
      <div>
         {/* text-3xl/lg:text-2xl 줄 높이(36px/32px)를 min-h로 직접 맞춘다 - flex 컨테이너는
            font-size/line-height만으로는 실제 높이가 안 늘어나서(자식이 전부 블록 요소라 텍스트
            공백이 없으면 line box가 안 생김), min-h를 명시로 줘야 한다 */}
         <div className="mb-1.5 flex min-h-9 items-center gap-1.5 lg:min-h-8">
            <Skeleton width={90} height={28} className="rounded-md" />
            <Skeleton width={48} height={14} className="rounded-md" />
         </div>
         <Skeleton width="100%" height={6} className="mb-4 rounded-full lg:mb-2" />
         <ul className="mb-4 flex flex-col gap-2 lg:mb-2 lg:gap-1">
            {Array.from({ length: rowCount }, (_, i) => (
               <li key={i} className="flex min-h-5 items-center gap-2">
                  <Skeleton width={8} height={8} className="shrink-0 rounded-full" />
                  <Skeleton width="55%" height={14} className="rounded-md" />
                  <Skeleton width={28} height={14} className="ml-auto shrink-0 rounded-md" />
               </li>
            ))}
         </ul>
      </div>
   );
}

function StatDotList({ stats }: { stats: StatDot[] }) {
   return (
      <ul className="mb-4 flex flex-col gap-2 lg:mb-2 lg:gap-1">
         {stats.map((stat) => (
            <li key={stat.label} className="flex items-center gap-2 text-sm">
               <span className={`h-2 w-2 shrink-0 rounded-full ${stat.colorClassName}`} />
               <span className="min-w-0 flex-1 truncate text-gray-600">{stat.label}</span>
               <span className="shrink-0 font-medium text-gray-900">{stat.value}</span>
            </li>
         ))}
      </ul>
   );
}

function StudentAttendanceCard({ cardHeight }: { cardHeight?: number }) {
   const [summary, setSummary] = useState<AttendanceSummaryResponse | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getMyAttendanceSummary()
         .then((result) => {
            if (isMounted) setSummary(result);
         })
         .catch(() => {
            if (isMounted) setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   // 아래 stats 배열 항목 수(5개)와 맞춰야 스켈레톤→실제 데이터 전환 시 카드 높이가 안 변한다
   if (isLoading || hasError || !summary) {
      return (
         <CardShell cardHeight={cardHeight}>
            <LoadingOrError
               hasError={hasError}
               rowCount={5}
               onRetry={() => {
                  setIsLoading(true);
                  setHasError(false);
                  setRetryKey((key) => key + 1);
               }}
            />
         </CardShell>
      );
   }

   const riskStatus = mapRiskLevel(summary.riskLevel);
   const stats: StatDot[] = [
      { label: '출석', value: `${summary.presentDays}일`, colorClassName: 'bg-brand-sage' },
      { label: '지각', value: `${summary.lateCount}회`, colorClassName: 'bg-brand-red/40' },
      { label: '조퇴', value: `${summary.earlyLeaveCount}회`, colorClassName: 'bg-brand-red' },
      { label: '외출', value: `${summary.outingCount}회`, colorClassName: 'bg-brand-red/20' },
      { label: '결석', value: `${summary.absentDays}일`, colorClassName: 'bg-brand-maroon' },
   ];

   return (
      <CardShell cardHeight={cardHeight}>
         <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gray-900 lg:text-2xl">
               {summary.attendanceRate}%
            </span>
            <span className="text-sm text-gray-400">출석률</span>
         </div>
         <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 lg:mb-2">
            <div className="h-full bg-brand-red" style={{ width: `${summary.attendanceRate}%` }} />
         </div>

         <StatDotList stats={stats} />

         {riskStatus !== 'NORMAL' && (
            <div className="flex items-start gap-1.5 rounded-sm bg-[#F5DFDC] px-3 py-2 text-xs text-brand-maroon lg:py-1.5">
               <TriangleAlert size={14} className="mt-0.5 shrink-0" />
               <span>{TRAINEE_RISK_LABELS[riskStatus]} — 출석 상태를 확인해주세요.</span>
            </div>
         )}
      </CardShell>
   );
}

function ManagerAttendanceCard({ cardHeight }: { cardHeight?: number }) {
   const [summary, setSummary] = useState<AttendanceDashboardSummary | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getAttendanceDashboardSummary()
         .then((result) => {
            if (isMounted) setSummary(result);
         })
         .catch(() => {
            if (isMounted) setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   // 아래 stats 배열 항목 수(4개)와 맞춰야 스켈레톤→실제 데이터 전환 시 카드 높이가 안 변한다
   if (isLoading || hasError || !summary) {
      return (
         <CardShell cardHeight={cardHeight}>
            <LoadingOrError
               hasError={hasError}
               rowCount={4}
               onRetry={() => {
                  setIsLoading(true);
                  setHasError(false);
                  setRetryKey((key) => key + 1);
               }}
            />
         </CardShell>
      );
   }

   // 구글 시트 동기화 전이면 서버가 이 값들을 null(또는 누락)로 내려줄 수 있어, 화면엔 항상 0으로 보정
   const attendedTodayCount = summary.attendedTodayCount ?? 0;
   // managedStudents는 "관리 대상"(주의 이상) 인원이라 정상 인원이 아님
   // 정상 인원은 진행 중인 전체 훈련생에서 관리 대상을 뺀 나머지
   const managedStudents = summary.managedStudents ?? 0;
   const normalStudents = Math.max(summary.activeStudents - managedStudents, 0);
   const cautionStudents = summary.cautionStudents ?? 0;
   const warningStudents = summary.warningStudents ?? 0;
   const riskStudents = summary.riskStudents ?? 0;
   const attendedRate =
      summary.activeStudents > 0 ? (attendedTodayCount / summary.activeStudents) * 100 : 0;
   const stats: StatDot[] = [
      { label: '정상', value: `${normalStudents}명`, colorClassName: 'bg-brand-sage' },
      { label: '주의', value: `${cautionStudents}명`, colorClassName: 'bg-brand-gold' },
      { label: '경고', value: `${warningStudents}명`, colorClassName: 'bg-brand-red' },
      { label: '제적위험', value: `${riskStudents}명`, colorClassName: 'bg-brand-maroon' },
   ];

   return (
      <CardShell cardHeight={cardHeight}>
         <div className="mb-1.5 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-gray-900 lg:text-2xl">
               {attendedTodayCount}/{summary.activeStudents}명
            </span>
            <span className="text-sm text-gray-400">정상 출결</span>
         </div>
         <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 lg:mb-2">
            <div className="h-full bg-brand-sage" style={{ width: `${attendedRate}%` }} />
         </div>

         <StatDotList stats={stats} />
      </CardShell>
   );
}

export default function AttendanceCard({ cardHeight }: { cardHeight?: number }) {
   const { role } = useAuth();
   if (role === 'STUDENT') return <StudentAttendanceCard cardHeight={cardHeight} />;
   return <ManagerAttendanceCard cardHeight={cardHeight} />;
}
