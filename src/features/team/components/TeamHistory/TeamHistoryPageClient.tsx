'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ApiError } from '@/lib/http';
import { getTeamHistories, getTeams } from '@/services/team.service';
import { formatTeamDateDot } from '../../formatTeamDate';
import type { TeamHistoryResult } from '../../types';
import TeamCompositionCard from './TeamCompositionCard';
import TeamHistoryTimeline from './TeamHistoryTimeline';

interface TeamPeriodGroup {
   key: string;
   startDate: string;
   endDate: string;
   teamNames: string[];
}

// 팀마다 지정한 기간(startDate~endDate)이 서로 다를 수 있어, 부트캠프 단위기간이 아니라
// 실제로 팀들이 쓰고 있는 기간을 기준으로 탭을 만든다. 같은 기간을 쓰는 팀은 한 탭으로 묶인다
function groupTeamsByPeriod(teams: { name: string; startDate: string | null; endDate: string | null }[]) {
   const map = new Map<string, TeamPeriodGroup>();
   teams.forEach((team) => {
      if (!team.startDate || !team.endDate) return;
      const key = `${team.startDate}_${team.endDate}`;
      const existing = map.get(key);
      if (existing) {
         existing.teamNames.push(team.name);
      } else {
         map.set(key, {
            key,
            startDate: team.startDate,
            endDate: team.endDate,
            teamNames: [team.name],
         });
      }
   });
   return Array.from(map.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export default function TeamHistoryPageClient() {
   const [periodGroups, setPeriodGroups] = useState<TeamPeriodGroup[]>([]);
   const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
   const [periodsError, setPeriodsError] = useState(false);
   const [activePeriodKey, setActivePeriodKey] = useState<string | null>(null);

   const [result, setResult] = useState<TeamHistoryResult | null>(null);
   // 기간이 정해지자마자 바로 조회를 시작하므로 처음부터 로딩 상태로 시작한다
   const [isLoadingResult, setIsLoadingResult] = useState(true);
   const [resultError, setResultError] = useState('');

   useEffect(() => {
      let isMounted = true;
      getTeams()
         .then((teams) => {
            if (!isMounted) return;
            const groups = groupTeamsByPeriod(teams);
            setPeriodGroups(groups);
            setActivePeriodKey(groups[0]?.key ?? null);
         })
         .catch(() => {
            if (isMounted) setPeriodsError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingPeriods(false);
         });
      return () => {
         isMounted = false;
      };
   }, []);

   const activePeriod = useMemo(
      () => periodGroups.find((group) => group.key === activePeriodKey) ?? null,
      [periodGroups, activePeriodKey],
   );

   useEffect(() => {
      if (!activePeriod) return;
      let isMounted = true;
      getTeamHistories(activePeriod.startDate, activePeriod.endDate)
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
   }, [activePeriod]);

   const handleSelectPeriod = (key: string) => {
      if (key === activePeriodKey) return;
      setIsLoadingResult(true);
      setActivePeriodKey(key);
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
         ) : periodGroups.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">기간이 지정된 팀이 없습니다.</p>
         ) : (
            <>
               <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
                  {periodGroups.map((group) => {
                     const isActive = group.key === activePeriodKey;
                     return (
                        <button
                           key={group.key}
                           type="button"
                           onClick={() => handleSelectPeriod(group.key)}
                           className={`flex max-w-56 cursor-pointer flex-col items-start gap-0.5 border-b-2 pb-3 text-left transition-colors ${
                              isActive ? 'border-brand-green' : 'border-transparent'
                           }`}
                        >
                           <span
                              className={`text-sm ${
                                 isActive ? 'font-bold text-gray-900' : 'font-medium text-gray-400'
                              }`}
                           >
                              {formatTeamDateDot(group.startDate)} ~ {formatTeamDateDot(group.endDate)}
                           </span>
                           <span className="w-full truncate text-xs text-gray-400">
                              {group.teamNames.join(', ')}
                           </span>
                        </button>
                     );
                  })}
               </div>

               <div className="mt-6">
                  {isLoadingResult ? (
                     <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
                  ) : resultError ? (
                     <p className="py-16 text-center text-sm text-gray-400">{resultError}</p>
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
                           <div className="mt-3 grid grid-cols-3 gap-4">
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
