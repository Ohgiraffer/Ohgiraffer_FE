'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { DraftTeam } from '../types';

interface MemberActionMenuProps {
   currentTeamId: number | null;
   teams: DraftTeam[];
   onMoveToTeam: (teamId: number) => void;
   onMoveToUnassigned: () => void;
}

export default function MemberActionMenu({
   currentTeamId,
   teams,
   onMoveToTeam,
   onMoveToUnassigned,
}: MemberActionMenuProps) {
   const [isOpen, setIsOpen] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (event: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isOpen]);

   const otherTeams = teams.filter((team) => team.teamId !== currentTeamId);

   const handleToggle = () => {
      if (teams.length === 0) {
         toast.error('아직 생성된 팀이 없습니다. 팀을 먼저 생성해주세요.');
         return;
      }
      setIsOpen((prev) => !prev);
   };

   return (
      <div ref={containerRef} className="relative">
         <button
            type="button"
            onClick={handleToggle}
            aria-label="팀원 더보기"
            className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
         >
            <MoreVertical size={14} />
         </button>

         {isOpen && (
            <div
               className={cn(
                  'absolute right-0 top-full z-10 mt-1 w-36 rounded-xs border border-gray-200 bg-white py-1 shadow-md',
               )}
            >
               {otherTeams.length > 0 && (
                  <>
                     <p className="px-3 pb-1 pt-1.5 text-[11px] font-medium text-gray-400">
                        다른 팀으로 이동
                     </p>
                     {otherTeams.map((team) => (
                        <button
                           key={team.teamId}
                           type="button"
                           onClick={() => {
                              setIsOpen(false);
                              onMoveToTeam(team.teamId);
                           }}
                           className="flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                           {team.name}
                        </button>
                     ))}
                  </>
               )}
               {currentTeamId !== null && (
                  <button
                     type="button"
                     onClick={() => {
                        setIsOpen(false);
                        onMoveToUnassigned();
                     }}
                     className={cn(
                        'flex w-full cursor-pointer items-center px-3 py-1.5 text-left text-xs font-medium text-gray-500 hover:bg-gray-50',
                        otherTeams.length > 0 && 'mt-1 border-t border-gray-100 pt-2',
                     )}
                  >
                     미배정으로 이동
                  </button>
               )}
            </div>
         )}
      </div>
   );
}
