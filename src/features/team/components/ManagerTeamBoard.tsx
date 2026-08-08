'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { setUnsavedChangesChecker } from '@/lib/navigationGuard';
import {
   assignTeamMember,
   getTeams,
   getUnassignedStudents,
   moveTeamMember,
   removeTeamMember,
   updateTeam,
} from '@/services/team.service';
import TeamCard from './TeamCard';
import UnassignedPanel from './UnassignedPanel';
import TeamCreateModal from './TeamCreateModal';
import type { Team, UnassignedStudent } from '../types';

interface MemberInfo {
   userId: number;
   name: string;
   email: string;
   originalTeamId: number | null;
   originalMemberId: number | null;
}

export default function ManagerTeamBoard() {
   const [teams, setTeams] = useState<Team[]>([]);
   const [unassigned, setUnassigned] = useState<UnassignedStudent[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   // resetDraft를 reload와 한 덩어리로 묶어서 관리한다 - 별도의 mutable ref로 분리하면
   // 리네임 등으로 refetchMetadataOnly가 연속 호출될 때 아직 끝나지 않은 이전 fetch가
   // resolve되는 시점에 그 사이 바뀐 ref 값을 읽어 잘못된 리셋 여부를 적용할 수 있다
   const [reload, setReload] = useState({ key: 0, resetDraft: true });

   const [draftAssignment, setDraftAssignment] = useState<Record<number, number | null>>({});
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
   const [dragOverTarget, setDragOverTarget] = useState<number | 'unassigned' | null>(null);
   const isSavingRef = useRef(false);

   useEffect(() => {
      let isMounted = true;
      const shouldResetDraft = reload.resetDraft;
      Promise.all([getTeams(), getUnassignedStudents()])
         .then(([teamsResult, unassignedResult]) => {
            if (!isMounted) return;
            setTeams(teamsResult);
            setUnassigned(unassignedResult);
            if (shouldResetDraft) {
               const next: Record<number, number | null> = {};
               teamsResult.forEach((team) => {
                  team.members.forEach((member) => {
                     next[member.userId] = team.teamId;
                  });
               });
               unassignedResult.forEach((student) => {
                  next[student.userId] = null;
               });
               setDraftAssignment(next);
            }
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
   }, [reload]);

   // 팀원 배치(드래그/이동)는 이 함수로 다시 불러오지 않는다 - 초안이 날아가기 때문
   const refetchMetadataOnly = () => {
      setReload((prev) => ({ key: prev.key + 1, resetDraft: false }));
   };

   // 저장(팀원 배치 확정) 이후에만 서버 기준으로 초안을 다시 세팅한다
   const refetchAndResetDraft = () => {
      setIsLoading(true);
      setHasError(false);
      setReload((prev) => ({ key: prev.key + 1, resetDraft: true }));
   };

   const memberInfoByUserId = useMemo(() => {
      const map = new Map<number, MemberInfo>();
      teams.forEach((team) => {
         team.members.forEach((member) => {
            map.set(member.userId, {
               userId: member.userId,
               name: member.userName,
               email: member.email,
               originalTeamId: team.teamId,
               originalMemberId: member.teamMemberId,
            });
         });
      });
      unassigned.forEach((student) => {
         map.set(student.userId, {
            userId: student.userId,
            name: student.name,
            email: student.email,
            originalTeamId: null,
            originalMemberId: null,
         });
      });
      return map;
   }, [teams, unassigned]);

   const membersByTeamId = useMemo(() => {
      const map = new Map<number, MemberInfo[]>();
      teams.forEach((team) => map.set(team.teamId, []));
      const unassignedList: MemberInfo[] = [];
      memberInfoByUserId.forEach((info) => {
         const targetTeamId = draftAssignment[info.userId] ?? null;
         if (targetTeamId === null) {
            unassignedList.push(info);
         } else {
            map.get(targetTeamId)?.push(info);
         }
      });
      return { byTeam: map, unassignedList };
   }, [teams, memberInfoByUserId, draftAssignment]);

   const isDirty = useMemo(() => {
      let dirty = false;
      memberInfoByUserId.forEach((info) => {
         if ((draftAssignment[info.userId] ?? null) !== info.originalTeamId) dirty = true;
      });
      return dirty;
   }, [memberInfoByUserId, draftAssignment]);

   // 사이드바 등 앱 내 이동은 navigationGuard로, 새로고침/탭 닫기는 beforeunload로 막는다
   useEffect(() => {
      setUnsavedChangesChecker(() => isDirty);
      return () => setUnsavedChangesChecker(null);
   }, [isDirty]);

   useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
         if (!isDirty) return;
         e.preventDefault();
         e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
   }, [isDirty]);

   // 브라우저 뒤로가기 대응: dirty 상태로 들어가는 시점에 같은 주소로 더미 히스토리를 하나 쌓아둔다.
   // 뒤로가기를 누르면 popstate가 뜨는데, 그때 다시 더미를 쌓아 실제 이동을 취소하고 확인을 받는다
   const guardPushedRef = useRef(false);
   const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);

   useEffect(() => {
      if (isDirty && !guardPushedRef.current) {
         window.history.pushState(null, '', window.location.href);
         guardPushedRef.current = true;
      } else if (!isDirty) {
         guardPushedRef.current = false;
      }
   }, [isDirty]);

   useEffect(() => {
      const handlePopState = () => {
         if (!isDirty) return;
         window.history.pushState(null, '', window.location.href);
         setIsBackConfirmOpen(true);
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
   }, [isDirty]);

   const handleConfirmLeaveBack = () => {
      setIsBackConfirmOpen(false);
      guardPushedRef.current = false;
      window.history.go(-2);
   };

   const moveDraft = (userId: number, targetTeamId: number | null) => {
      setDraftAssignment((prev) => ({ ...prev, [userId]: targetTeamId }));
   };

   const handleRename = async (teamId: number, name: string) => {
      const team = teams.find((t) => t.teamId === teamId);
      if (!team) return;
      if (!team.startDate || !team.endDate) {
         toast.error('팀 기간 정보가 없어 수정할 수 없습니다.');
         return;
      }
      try {
         await updateTeam(teamId, { name, startDate: team.startDate, endDate: team.endDate });
         toast.success('팀명을 수정했습니다.');
         refetchMetadataOnly();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '팀명 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   const handleCreated = () => {
      setIsCreateOpen(false);
      refetchMetadataOnly();
   };

   const handleSaveClick = () => {
      if (!isDirty) return;
      setIsSaveConfirmOpen(true);
   };

   const handleConfirmSave = async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const changed: MemberInfo[] = [];
      memberInfoByUserId.forEach((info) => {
         const nextTeamId = draftAssignment[info.userId] ?? null;
         if (nextTeamId !== info.originalTeamId) changed.push(info);
      });

      const failures: string[] = [];
      for (const info of changed) {
         const nextTeamId = draftAssignment[info.userId] ?? null;
         try {
            if (info.originalTeamId === null && nextTeamId !== null) {
               await assignTeamMember(nextTeamId, info.userId);
            } else if (info.originalTeamId !== null && nextTeamId === null) {
               await removeTeamMember(info.originalTeamId, info.originalMemberId!);
            } else if (
               info.originalTeamId !== null &&
               nextTeamId !== null &&
               info.originalTeamId !== nextTeamId
            ) {
               await moveTeamMember(info.originalTeamId, info.originalMemberId!, nextTeamId);
            }
         } catch (err) {
            failures.push(`${info.name}: ${err instanceof ApiError ? err.message : '처리 실패'}`);
         }
      }

      setIsSaveConfirmOpen(false);
      isSavingRef.current = false;

      if (failures.length > 0) {
         toast.error(`일부 팀원의 변경사항을 저장하지 못했습니다.\n${failures.join('\n')}`);
      } else {
         toast.success('팀 구성을 저장했습니다.');
      }
      refetchAndResetDraft();
   };

   const handleHistoryClick = () => {
      toast.warning('팀 변경 이력 조회는 추후 지원될 예정입니다.');
   };

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
                  onClick={refetchAndResetDraft}
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
         <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">팀 관리</h1>
            <div className="flex items-center gap-2">
               <button
                  type="button"
                  onClick={handleHistoryClick}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xs border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  <Clock size={14} />
                  이력 보기
               </button>
               <button
                  type="button"
                  onClick={handleSaveClick}
                  disabled={!isDirty}
                  className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  저장
               </button>
            </div>
         </div>

         <div className="mt-5 grid grid-cols-[260px_1fr] gap-4">
            <UnassignedPanel
               students={membersByTeamId.unassignedList.map((info) => ({
                  userId: info.userId,
                  name: info.name,
                  email: info.email,
               }))}
               teams={teams}
               isDragOver={dragOverTarget === 'unassigned'}
               onDragOverChange={(isOver) => setDragOverTarget(isOver ? 'unassigned' : null)}
               onDropUser={(userId) => moveDraft(userId, null)}
               onDragStartUser={() => {}}
               onMoveUserToTeam={(userId, targetTeamId) => moveDraft(userId, targetTeamId)}
            />

            <div className="grid grid-cols-3 gap-4">
               {teams.map((team) => (
                  <TeamCard
                     key={team.teamId}
                     team={team}
                     members={(membersByTeamId.byTeam.get(team.teamId) ?? []).map((info) => ({
                        userId: info.userId,
                        name: info.name,
                        email: info.email,
                     }))}
                     allTeams={teams}
                     isDragOver={dragOverTarget === team.teamId}
                     onDragOverChange={(isOver) => setDragOverTarget(isOver ? team.teamId : null)}
                     onRename={handleRename}
                     onDropUser={(userId) => moveDraft(userId, team.teamId)}
                     onDragStartUser={() => {}}
                     onMoveUserToTeam={(userId, targetTeamId) => moveDraft(userId, targetTeamId)}
                     onUnassignUser={(userId) => moveDraft(userId, null)}
                  />
               ))}

               <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="flex h-fit cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
               >
                  <Plus size={16} />
                  팀 추가
               </button>
            </div>
         </div>

         {isCreateOpen && (
            <TeamCreateModal
               existingTeams={teams}
               onClose={() => setIsCreateOpen(false)}
               onCreated={handleCreated}
            />
         )}

         <ConfirmModal
            open={isSaveConfirmOpen}
            title="팀 구성 내용을 저장하시겠습니까?"
            description="현재 팀 배정 결과를 바탕으로 단체 채팅방과 Notion 페이지가 생성됩니다."
            confirmLabel="저장"
            onConfirm={handleConfirmSave}
            onClose={() => setIsSaveConfirmOpen(false)}
         />

         <ConfirmModal
            open={isBackConfirmOpen}
            title="저장하지 않은 변경사항이 있습니다"
            description="지금 나가면 변경사항이 저장되지 않습니다. 그래도 나가시겠습니까?"
            confirmLabel="나가기"
            variant="danger"
            onConfirm={handleConfirmLeaveBack}
            onClose={() => setIsBackConfirmOpen(false)}
         />
      </div>
   );
}
