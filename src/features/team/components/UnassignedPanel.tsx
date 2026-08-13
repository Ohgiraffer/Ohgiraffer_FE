'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import SearchInput from '@/components/ui/SearchInput';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
import MemberActionMenu from './MemberActionMenu';
import { TEAM_MEMBER_DRAG_TYPE, type DraftTeam } from '../types';

export interface UnassignedStudentItem {
   userId: number;
   name: string | null;
   email: string | null;
   profileImgUrl: string | null;
}

interface UnassignedPanelProps {
   students: UnassignedStudentItem[];
   teams: DraftTeam[];
   isDragOver: boolean;
   onDragOverChange: (isOver: boolean) => void;
   onDropUser: (userId: number) => void;
   onDragStartUser: (userId: number) => void;
   onMoveUserToTeam: (userId: number, teamId: number) => void;
}

export default function UnassignedPanel({
   students,
   teams,
   isDragOver,
   onDragOverChange,
   onDropUser,
   onDragStartUser,
   onMoveUserToTeam,
}: UnassignedPanelProps) {
   const [keyword, setKeyword] = useState('');

   const filtered = students.filter((student) =>
      (student.name ?? '').toLowerCase().includes(keyword.trim().toLowerCase()),
   );

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
            'h-fit rounded-xs border bg-white p-4 transition-colors',
            isDragOver ? 'border-brand-green bg-[#F0F4F2]' : 'border-[#E5E7EB]',
         )}
      >
         <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">미배정 훈련생</span>
            <span className="rounded-xs bg-[#EAF3EC] px-2 py-0.5 text-xs font-medium text-brand-green">
               {students.length}명
            </span>
         </div>

         <SearchInput
            onSearch={setKeyword}
            placeholder="훈련생 이름으로 검색"
            className="mt-3 w-full"
            heightClassName="h-8"
            compact
         />

         <div className="mt-3 flex flex-col gap-1.5">
            {filtered.length === 0 ? (
               <p className="py-6 text-center text-xs text-gray-300">
                  {students.length === 0 ? '미배정 훈련생이 없습니다' : '검색 결과가 없습니다'}
               </p>
            ) : (
               filtered.map((student) => (
                  <div
                     key={student.userId}
                     draggable
                     onDragStart={(e) => {
                        e.dataTransfer.setData(TEAM_MEMBER_DRAG_TYPE, String(student.userId));
                        onDragStartUser(student.userId);
                     }}
                     className="flex cursor-grab items-center justify-between gap-2 rounded-xs border border-gray-100 bg-[#F9FAFB] px-2.5 py-2 active:cursor-grabbing"
                  >
                     <div className="flex min-w-0 items-center gap-2">
                        <ChatAvatar
                           name={student.name}
                           imageUrl={student.profileImgUrl}
                           size="sm"
                           sizeClassName="h-8.5 w-8.5"
                           bgClassName="bg-white"
                           iconSize={16}
                           borderClassName="border border-gray-200"
                        />
                        <span className="truncate text-sm text-gray-700">{student.name || '이름 없음'}</span>
                     </div>
                     <MemberActionMenu
                        currentTeamId={null}
                        teams={teams}
                        onMoveToTeam={(teamId) => onMoveUserToTeam(student.userId, teamId)}
                        onMoveToUnassigned={() => {}}
                     />
                  </div>
               ))
            )}
         </div>
      </div>
   );
}
