'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ApiError } from '@/lib/http';
import { getTeamHistories, getTeamPeriods } from '@/services/team.service';
import { formatTeamDateDot } from '../../formatTeamDate';
import TeamPeriodTabs from '../TeamPeriodTabs';
import type { TeamHistoryResult } from '../../types';
import TeamCompositionCard from './TeamCompositionCard';
import TeamHistoryTimeline from './TeamHistoryTimeline';

export default function TeamHistoryPageClient() {
   // StudentTeamView/ManagerTeamBoard와 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: periods = [],
      isLoading: isLoadingPeriods,
      isError: periodsError,
   } = useQuery({
      queryKey: ['teamPeriods'],
      queryFn: getTeamPeriods,
   });
   const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
   // 기간 목록이 도착하면 마지막(최신) 기간을 기본 선택한다 - 한 번만 시딩한다
   const [hasSeededActivePeriod, setHasSeededActivePeriod] = useState(false);
   if (!hasSeededActivePeriod && periods.length > 0) {
      setHasSeededActivePeriod(true);
      setActivePeriodId(periods[periods.length - 1].teamPeriodId);
   }

   const [result, setResult] = useState<TeamHistoryResult | null>(null);
   // 기간이 정해지자마자 바로 조회를 시작하므로 처음부터 로딩 상태로 시작한다
   const [isLoadingResult, setIsLoadingResult] = useState(true);
   const [resultError, setResultError] = useState('');
   // 같은 기간을 다시 조회하는 재시도용 - handleSelectPeriod는 activePeriodId가 그대로면
   // 아무 것도 안 하므로, 실패 후 재시도는 이 키를 올려서 effect를 다시 돌게 한다
   const [resultRetryKey, setResultRetryKey] = useState(0);

   const activePeriod = useMemo(
      () => periods.find((p) => p.teamPeriodId === activePeriodId) ?? null,
      [periods, activePeriodId],
   );

   useEffect(() => {
      if (!activePeriod) return;
      let isMounted = true;
      getTeamHistories(activePeriod.teamPeriodId, activePeriod.startDate, activePeriod.endDate)
         .then((data) => {
            if (!isMounted) return;
            setResult(data);
            setResultError('');
         })
         .catch((err) => {
            if (!isMounted) return;
            setResult(null);
            setResultError(
               err instanceof ApiError
                  ? err.message
                  : '이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoadingResult(false);
         });
      return () => {
         isMounted = false;
      };
   }, [activePeriod, resultRetryKey]);

   const handleSelectPeriod = (periodId: number) => {
      if (periodId === activePeriodId) return;
      setIsLoadingResult(true);
      setActivePeriodId(periodId);
   };

   const retryResult = () => {
      setIsLoadingResult(true);
      setResultError('');
      setResultRetryKey((key) => key + 1);
   };

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <Link
            href="/team"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            팀 관리로 돌아가기
         </Link>
         <h1 className="mt-3 text-2xl font-bold text-gray-900">팀 변경 이력</h1>

         {isLoadingPeriods ? (
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : periodsError ? (
            <p className="py-16 text-center text-sm text-gray-400">팀 정보를 불러오지 못했습니다.</p>
         ) : periods.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">기간이 지정된 팀이 없습니다.</p>
         ) : (
            <>
               <TeamPeriodTabs
                  periods={periods}
                  activePeriodId={activePeriodId}
                  onSelect={handleSelectPeriod}
               />

               <div className="mt-6">
                  {isLoadingResult ? (
                     <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
                  ) : resultError ? (
                     <div className="flex flex-col items-center gap-3 py-16">
                        <p className="text-sm text-gray-400">{resultError}</p>
                        <button
                           type="button"
                           onClick={retryResult}
                           className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                           다시 시도
                        </button>
                     </div>
                  ) : result ? (
                     <>
                        <div className="flex items-center gap-2">
                           <h2 className="text-sm font-bold text-gray-900">
                              {formatTeamDateDot(result.snapshotDate)} 기준 팀 구성
                           </h2>
                           <span className="rounded-xs bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
                              읽기 전용
                           </span>
                        </div>
                        {result.teams.length === 0 ? (
                           <p className="mt-3 text-sm text-gray-400">해당 시점에 팀이 없습니다.</p>
                        ) : (
                           <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                              {result.teams.map((team) => (
                                 <TeamCompositionCard key={team.teamId} team={team} />
                              ))}
                           </div>
                        )}

                        <h2 className="mt-8 text-sm font-bold text-gray-900">변경 이력</h2>
                        <TeamHistoryTimeline entries={result.histories} />
                     </>
                  ) : null}
               </div>
            </>
         )}
      </div>
   );
}
