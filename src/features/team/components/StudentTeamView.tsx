'use client';

import { useEffect, useState } from 'react';
import { getTeams } from '@/services/team.service';
import { formatTeamPeriod } from '../formatTeamDate';
import type { Team } from '../types';

export default function StudentTeamView() {
   const [teams, setTeams] = useState<Team[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getTeams()
         .then((result) => {
            if (isMounted) setTeams(result);
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

   if (isLoading) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
         </div>
      );
   }

   if (hasError) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="flex flex-col items-center gap-3 py-16">
               <p className="text-sm text-gray-400">팀 정보를 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={() => {
                     setIsLoading(true);
                     setHasError(false);
                     setRetryKey((key) => key + 1);
                  }}
                  className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <h1 className="text-lg font-bold text-gray-900">팀 관리</h1>

         {teams.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">생성된 팀이 없습니다</p>
         ) : (
            <div className="mt-5 grid grid-cols-3 gap-4">
               {teams.map((team) => (
                  <div key={team.teamId} className="rounded-sm border border-[#E5E7EB] bg-white p-4">
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
                           <p className="py-4 text-center text-xs text-gray-300">배정된 팀원이 없습니다</p>
                        ) : (
                           team.members.map((member) => (
                              <div
                                 key={member.teamMemberId}
                                 className="flex items-center gap-2 rounded-xs border border-gray-100 bg-[#F9FAFB] px-2.5 py-2"
                              >
                                 <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                    {member.userName.slice(0, 1)}
                                 </span>
                                 <span className="truncate text-sm text-gray-700">{member.userName}</span>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
