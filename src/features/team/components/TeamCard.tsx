'use client';

import { useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
import { formatTeamPeriod } from '../formatTeamDate';
import MemberActionMenu from './MemberActionMenu';
import TeamWorkspaceLink from './TeamWorkspaceLink';
import { TEAM_MEMBER_DRAG_TYPE, type DraftTeam } from '../types';

export interface TeamCardMember {
   userId: number;
   name: string | null;
   email: string | null;
   profileImgUrl: string | null;
}

interface TeamCardProps {
   team: DraftTeam;
   members: TeamCardMember[];
   allTeams: DraftTeam[];
   isDragOver: boolean;
   onDragOverChange: (isOver: boolean) => void;
   onRename: (teamId: number, name: string) => void;
   onDeleteTeam: (teamId: number) => void;
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
   onDeleteTeam,
   onDropUser,
   onDragStartUser,
   onMoveUserToTeam,
   onUnassignUser,
}: TeamCardProps) {
   const [isEditingName, setIsEditingName] = useState(false);
   const [nameDraft, setNameDraft] = useState(team.name);
   const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

   const startEditing = () => {
      setNameDraft(team.name);
      setIsEditingName(true);
   };

   const commitName = () => {
      const trimmed = nameDraft.trim();
      if (!trimmed || trimmed === team.name) {
         setIsEditingName(false);
         return;
      }
      // 같은 기간(=이 화면에 지금 떠 있는 팀들) 안에서만 중복을 막는다 - 다른 기간의 팀명과는 겹쳐도 된다
      if (allTeams.some((t) => t.teamId !== team.teamId && t.name === trimmed)) {
         toast.error('이미 같은 이름의 팀이 있습니다.');
         return;
      }
      setIsEditingName(false);
      onRename(team.teamId, trimmed);
   };

   // 팀원이 없으면 바로 삭제, 있으면 가벼운 인라인 확인을 한 번 거친다
   const handleDeleteClick = () => {
      if (members.length === 0) {
         onDeleteTeam(team.teamId);
      } else {
         setIsConfirmingDelete(true);
      }
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
            'rounded-xs border bg-white p-4 transition-colors',
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

            {isConfirmingDelete ? (
               <div className="flex shrink-0 items-center gap-1">
                  <span className="text-xs font-medium whitespace-nowrap text-brand-maroon">
                     {members.length}명 삭제?
                  </span>
                  <button
                     type="button"
                     onClick={() => onDeleteTeam(team.teamId)}
                     aria-label="팀 삭제 확정"
                     className="cursor-pointer rounded-xs p-1 text-brand-maroon hover:bg-red-50"
                  >
                     <Check size={14} />
                  </button>
                  <button
                     type="button"
                     onClick={() => setIsConfirmingDelete(false)}
                     aria-label="팀 삭제 취소"
                     className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-50"
                  >
                     <X size={14} />
                  </button>
               </div>
            ) : (
               <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded-xs bg-[#EAF3EC] px-2 py-0.5 text-xs font-medium text-brand-green">
                     {members.length}명
                  </span>
                  <button
                     type="button"
                     onClick={handleDeleteClick}
                     aria-label="팀 삭제"
                     className="cursor-pointer rounded-xs p-1 text-gray-300 hover:bg-gray-50 hover:text-brand-maroon"
                  >
                     <Trash2 size={14} />
                  </button>
               </div>
            )}
         </div>
         <p className="mt-1 text-xs text-gray-400">{formatTeamPeriod(team.startDate, team.endDate)}</p>

         <div className="mt-3 flex flex-col gap-1.5">
            {members.map((member) => {
               const displayName = member.name || '이름 없음';
               return (
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
                     <ChatAvatar name={member.name} imageUrl={member.profileImgUrl} size="sm" />
                     <span className="truncate text-sm text-gray-700">{displayName}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                     <button
                        type="button"
                        onClick={() => onUnassignUser(member.userId)}
                        aria-label={`${displayName} 팀에서 제외`}
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
               );
            })}
         </div>

         <div
            className={cn(
               'mt-2 rounded-xs border border-dashed py-3 text-center text-xs',
               isDragOver ? 'border-brand-green text-brand-green' : 'border-gray-200 text-gray-300',
            )}
         >
            여기에 드래그
         </div>

         <TeamWorkspaceLink teamId={team.teamId} />
      </div>
   );
}
