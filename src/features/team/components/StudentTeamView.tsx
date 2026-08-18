'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeamPeriods, getTeams } from '@/services/team.service';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { formatTeamPeriod } from '../formatTeamDate';
import TeamPeriodTabs from './TeamPeriodTabs';
import TeamWorkspaceLink from './TeamWorkspaceLink';
import type { Team, TeamPeriod } from '../types';

interface StudentTeamViewProps {
   // team/page.tsx가 서버에서 미리 불러와 넘겨주는 초기 데이터 - 없으면(캐시 히트, 검증 실패 등)
   // 지금처럼 클라이언트에서 직접 불러온다
   initialPeriods?: TeamPeriod[];
   initialActivePeriodId?: number | null;
   initialTeams?: Team[];
}

// 훈련생용 "팀 현황" - 기간을 넘나들며 과거 팀 구성도 볼 수 있지만(TeamPeriodTabs), 변경
// 이력(누가 언제 옮겼는지)까지는 보여주지 않는다. 그래서 getTeamHistories는 쓰지 않고
// 매니저 보드와 동일하게 getTeams(periodId)만으로 팀 구성 스냅샷만 조회한다(읽기 전용)
export default function StudentTeamView({
   initialPeriods,
   initialActivePeriodId,
   initialTeams,
}: StudentTeamViewProps) {
   // ManagerTeamBoard/TeamHistoryPageClient와 같은 queryKey를 써서 캐시를 공유한다
   const {
      data: periods = [],
      isLoading: isLoadingPeriods,
      isError: periodsError,
   } = useQuery({
      queryKey: ['teamPeriods'],
      queryFn: getTeamPeriods,
      initialData: initialPeriods,
   });
   const [activePeriodId, setActivePeriodId] = useState<number | null>(
      initialActivePeriodId ?? null,
   );
   // 기간 목록이 도착하면 마지막(최신) 기간을 기본 선택한다 - 한 번만 시딩한다. 서버가 이미
   // initialActivePeriodId를 시딩해줬으면 이 이펙트가 다시 덮어쓰지 않도록 시딩된 것으로 시작
   const [hasSeededActivePeriod, setHasSeededActivePeriod] = useState(
      initialActivePeriodId != null,
   );
   if (!hasSeededActivePeriod && periods.length > 0) {
      setHasSeededActivePeriod(true);
      setActivePeriodId(periods[periods.length - 1].teamPeriodId);
   }

   const [teams, setTeams] = useState<Team[]>(initialTeams ?? []);
   const [isLoadingTeams, setIsLoadingTeams] = useState(!initialTeams);
   const [teamsError, setTeamsError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);
   // 서버가 이미 initialActivePeriodId 몫의 팀 데이터를 넘겨줬으면, 그 값으로 시작하자마자
   // 같은 기간을 또 불러오지 않게 첫 실행 한 번은 건너뛴다
   const skipNextFetchRef = useRef(initialTeams != null);

   useEffect(() => {
      // 이 분기는 실제 렌더링 상황에서는 도달하지 않는다(§ManagerTeamBoard.tsx와 동일한 이유)
      if (activePeriodId == null) return;
      if (skipNextFetchRef.current) {
         skipNextFetchRef.current = false;
         return;
      }
      let isMounted = true;
      // isLoadingTeams/teamsError는 effect 밖(handleSelectPeriod/handleRetry)에서 미리 세팅한다
      getTeams(activePeriodId)
         .then((result) => {
            if (isMounted) setTeams(result);
         })
         .catch(() => {
            if (isMounted) setTeamsError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingTeams(false);
         });
      return () => {
         isMounted = false;
      };
   }, [activePeriodId, retryKey]);

   if (isLoadingPeriods) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <Skeleton width={100} height={28} className="rounded-md" />
            <div className="mt-5 flex gap-4 border-b border-gray-200 pb-3">
               <Skeleton width={64} height={20} className="rounded-md" />
               <Skeleton width={64} height={20} className="rounded-md" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
               {[0, 1, 2].map((i) => (
                  <Skeleton key={i} width="100%" height={200} className="rounded-xs" />
               ))}
            </div>
         </div>
      );
   }

   if (periodsError) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <p className="py-16 text-center text-sm text-gray-400">
               기간 정보를 불러오지 못했습니다.
            </p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-2xl font-bold text-gray-900">팀 현황</h1>

         {periods.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">생성된 기간이 없습니다</p>
         ) : (
            <>
               <TeamPeriodTabs
                  periods={periods}
                  activePeriodId={activePeriodId}
                  onSelect={(periodId) => {
                     setIsLoadingTeams(true);
                     setTeamsError(false);
                     setActivePeriodId(periodId);
                  }}
               />

               {isLoadingTeams ? (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                     {[0, 1, 2].map((i) => (
                        <Skeleton key={i} width="100%" height={200} className="rounded-xs" />
                     ))}
                  </div>
               ) : teamsError ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                     <p className="text-sm text-gray-400">팀 정보를 불러오지 못했습니다.</p>
                     <button
                        type="button"
                        onClick={() => {
                           setIsLoadingTeams(true);
                           setTeamsError(false);
                           setRetryKey((key) => key + 1);
                        }}
                        className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                        다시 시도
                     </button>
                  </div>
               ) : teams.length === 0 ? (
                  <p className="py-16 text-center text-sm text-gray-400">생성된 팀이 없습니다</p>
               ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                     {teams.map((team) => (
                        <div
                           key={team.teamId}
                           className="rounded-xs border border-[#E5E7EB] bg-white p-4"
                        >
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-900">{team.name}</span>
                              <span className="rounded-xs bg-[#EAF3EC] px-2 py-0.5 text-xs font-medium text-brand-green">
                                 {team.memberCount}명
                              </span>
                           </div>
                           <p className="mt-1 text-xs text-gray-400">
                              {formatTeamPeriod(team.startDate, team.endDate)}
                           </p>

                           <div className="mt-3 flex flex-col gap-1.5">
                              {team.members.length === 0 ? (
                                 <p className="py-4 text-center text-xs text-gray-300">
                                    배정된 팀원이 없습니다
                                 </p>
                              ) : (
                                 team.members.map((member) => (
                                    <div
                                       key={member.teamMemberId}
                                       className="flex items-center gap-2 rounded-xs border border-gray-100 bg-[#F9FAFB] px-2.5 py-2"
                                    >
                                       <ChatAvatar
                                          name={member.userName}
                                          imageUrl={member.profileImgUrl}
                                          size="sm"
                                          sizeClassName="h-8.5 w-8.5"
                                          bgClassName="bg-white"
                                          iconSize={16}
                                          borderClassName="border border-gray-200"
                                       />
                                       <span className="truncate text-sm text-gray-700">
                                          {member.userName || '이름 없음'}
                                       </span>
                                    </div>
                                 ))
                              )}
                           </div>

                           <TeamWorkspaceLink teamId={team.teamId} />
                        </div>
                     ))}
                  </div>
               )}
            </>
         )}
      </div>
   );
}
