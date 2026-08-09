'use client';

import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTeamPeriod } from '../formatTeamDate';
import MemberActionMenu from './MemberActionMenu';
import { TEAM_MEMBER_DRAG_TYPE, type Team } from '../types';

export interface TeamCardMember {
   userId: number;
   name: string;
   email: string;
}

interface TeamCardProps {
   team: Team;
   members: TeamCardMember[];
   allTeams: Team[];
   isDragOver: boolean;
   onDragOverChange: (isOver: boolean) => void;
   onRename: (teamId: number, name: string) => void;
   onDropUser: (userId: number) => void;
   onDragStartUser: (userId: number) => void;
   onMoveUserToTeam: (userId: number, teamId: number) => void;
   onUnassignUser: (userId: number) => void;
}

export default function TeamCard({
   team,
   members,
   allTeams,
   isDragOver,
   onDragOverChange,
   onRename,
   onDropUser,
   onDragStartUser,
   onMoveUserToTeam,
   onUnassignUser,
}: TeamCardProps) {
   const [isEditingName, setIsEditingName] = useState(false);
   const [nameDraft, setNameDraft] = useState(team.name);

   const startEditing = () => {
      setNameDraft(team.name);
      setIsEditingName(true);
   };

   const commitName = () => {
      setIsEditingName(false);
      const trimmed = nameDraft.trim();
      if (!trimmed || trimmed === team.name) return;
      onRename(team.teamId, trimmed);
   };

   return (
      <div
         onDragOver={(e) => {
            e.preventDefault();
            onDragOverChange(true);
         }}
         onDragLeave={() => onDragOverChange(false)}
         onDrop={(e) => {
            e.preventDefault();
            onDragOverChange(false);
            const raw = e.dataTransfer.getData(TEAM_MEMBER_DRAG_TYPE).trim();
            if (!raw) return;
            const userId = Number(raw);
            if (Number.isSafeInteger(userId) && userId > 0) onDropUser(userId);
         }}
         className={cn(
            'rounded-sm border bg-white p-4 transition-colors',
            isDragOver ? 'border-brand-green bg-[#F0F4F2]' : 'border-[#E5E7EB]',
         )}
      >
         <div className="flex items-start justify-between">
            {isEditingName ? (
               <div className="flex items-center gap-1">
                  <input
                     autoFocus
                     value={nameDraft}
                     onChange={(e) => setNameDraft(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') commitName();
                        if (e.key === 'Escape') setIsEditingName(false);
                     }}
                     className="h-7 w-28 rounded-xs border border-brand-green px-2 text-sm font-bold text-gray-900 focus:outline-none"
                  />
                  <button
                     type="button"
                     onClick={commitName}
                     aria-label="팀명 저장"
                     className="cursor-pointer rounded-xs p-1 text-brand-green hover:bg-gray-50"
                  >
                     <Check size={14} />
                  </button>
               </div>
            ) : (
               <button
                  type="button"
                  onClick={startEditing}
                  className="group flex cursor-pointer items-center gap-1.5"
               >
                  <span className="text-sm font-bold text-gray-900">{team.name}</span>
                  <Pencil size={12} className="text-gray-300 group-hover:text-gray-500" />
               </button>
            )}
            <span className="rounded-xs bg-[#EAF3EC] px-2 py-0.5 text-xs font-medium text-brand-green">
               {members.length}명
            </span>
         </div>
         <p className="mt-1 text-xs text-gray-400">{formatTeamPeriod(team.startDate, team.endDate)}</p>

         <div className="mt-3 flex flex-col gap-1.5">
            {members.map((member) => (
               <div
                  key={member.userId}
                  draggable
                  onDragStart={(e) => {
                     e.dataTransfer.setData(TEAM_MEMBER_DRAG_TYPE, String(member.userId));
                     onDragStartUser(member.userId);
                  }}
                  className="flex cursor-grab items-center justify-between rounded-xs border border-gray-100 bg-[#F9FAFB] px-2.5 py-2 active:cursor-grabbing"
               >
                  <div className="flex min-w-0 items-center gap-2">
                     <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                        {member.name.slice(0, 1)}
                     </span>
                     <span className="truncate text-sm text-gray-700">{member.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                     <button
                        type="button"
                        onClick={() => onUnassignUser(member.userId)}
                        aria-label={`${member.name} 팀에서 제외`}
                        className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100 hover:text-brand-maroon"
                     >
                        <X size={14} />
                     </button>
                     <MemberActionMenu
                        currentTeamId={team.teamId}
                        teams={allTeams}
                        onMoveToTeam={(teamId) => onMoveUserToTeam(member.userId, teamId)}
                        onMoveToUnassigned={() => onUnassignUser(member.userId)}
                     />
                  </div>
               </div>
            ))}
         </div>

         <div
            className={cn(
               'mt-2 rounded-xs border border-dashed py-3 text-center text-xs',
               isDragOver ? 'border-brand-green text-brand-green' : 'border-gray-200 text-gray-300',
            )}
         >
            여기에 드래그
         </div>
      </div>
   );
}
