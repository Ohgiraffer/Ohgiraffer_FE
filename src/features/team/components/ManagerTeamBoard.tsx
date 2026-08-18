'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Clock, Plus } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { useLeaveGuard } from '@/lib/hooks/useLeaveGuard';
import {
   deleteTeamPeriod,
   getTeams,
   getTeamPeriods,
   getUnassignedStudents,
   updateTeamConfiguration,
} from '@/services/team.service';
import TeamCard from './TeamCard';
import UnassignedPanel from './UnassignedPanel';
import TeamAddCard from './TeamAddCard';
import TeamPeriodTabs from './TeamPeriodTabs';
import type {
   DraftTeam,
   Team,
   TeamConfigurationRequest,
   TeamConfigurationTeamInput,
   TeamPeriod,
   UnassignedStudent,
} from '../types';

interface MemberInfo {
   userId: number;
   name: string | null;
   email: string | null;
   profileImgUrl: string | null;
   originalTeamId: number | null;
}

// 기간 추가/수정 버튼을 누를 때만 필요한 날짜선택 모달이라 지연 로딩
const TeamPeriodAddModal = dynamic(() => import('./TeamPeriodAddModal'), { ssr: false });

export default function ManagerTeamBoard() {
   const queryClient = useQueryClient();
   // StudentTeamView/TeamHistoryPageClient와 같은 queryKey를 써서 캐시를 공유
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
   const [isPeriodAddOpen, setIsPeriodAddOpen] = useState(false);
   const [editingPeriod, setEditingPeriod] = useState<TeamPeriod | null>(null);
   const [deletingPeriod, setDeletingPeriod] = useState<TeamPeriod | null>(null);
   const isDeletingPeriodRef = useRef(false);

   const [serverTeams, setServerTeams] = useState<Team[]>([]);
   const [unassigned, setUnassigned] = useState<UnassignedStudent[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [reloadKey, setReloadKey] = useState(0);

   // 팀 목록 자체도 초안: 실제 팀(teamId >= 0) + 이번 세션에 추가했지만 아직 저장 안 한 팀(teamId < 0)
   const [draftTeams, setDraftTeams] = useState<DraftTeam[]>([]);
   // 삭제 예정인 "실제" 팀 id만 (새로 추가했다가 지운 팀은 draftTeams에서 그냥 제거, 여기 안 넣음)
   const [deletedTeamIds, setDeletedTeamIds] = useState<number[]>([]);
   const [draftAssignment, setDraftAssignment] = useState<Record<number, number | null>>({});
   const nextDraftIdRef = useRef(-1);

   const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
   const [createChatChannel, setCreateChatChannel] = useState(true);
   const [createNotionPage, setCreateNotionPage] = useState(true);
   const [dragOverTarget, setDragOverTarget] = useState<number | 'unassigned' | null>(null);
   const [isSaving, setIsSaving] = useState(false);
   const isSavingRef = useRef(false);
   const [isDeletingPeriod, setIsDeletingPeriod] = useState(false);

   // 2) 선택된 기간의 팀/미배정 목록
   useEffect(() => {
      if (activePeriodId == null) return;
      let isMounted = true;
      // isLoading/hasError는 이 effect가 아니라,
      // activePeriodId/reloadKey를 바꾸는 이벤트 핸들러 쪽(switchPeriod/reloadTeams)에서 미리 세팅
      Promise.all([getTeams(activePeriodId), getUnassignedStudents(activePeriodId)])
         .then(([teamsResult, unassignedResult]) => {
            if (!isMounted) return;
            setServerTeams(teamsResult);
            setUnassigned(unassignedResult);
            setDraftTeams(
               teamsResult.map((t) => ({
                  teamId: t.teamId,
                  name: t.name,
                  startDate: t.startDate,
                  endDate: t.endDate,
                  dissolved: t.dissolved,
               })),
            );
            setDeletedTeamIds([]);
            const next: Record<number, number | null> = {};
            teamsResult.forEach((team) => {
               team.members.forEach((member) => {
                  next[member.userId] = team.teamId;
               });
            });
            unassignedResult.forEach((student) => {
               // 서버가 내려준 팀 배정 정보가 이미 있으면 그걸 우선함(두 응답이 불일치할 경우의 방어)
               if (student.userId in next) return;
               next[student.userId] = null;
            });
            setDraftAssignment(next);
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
   }, [activePeriodId, reloadKey]);

   const memberInfoByUserId = useMemo(() => {
      const map = new Map<number, MemberInfo>();
      serverTeams.forEach((team) => {
         team.members.forEach((member) => {
            map.set(member.userId, {
               userId: member.userId,
               name: member.userName,
               email: member.email,
               profileImgUrl: member.profileImgUrl,
               originalTeamId: team.teamId,
            });
         });
      });
      unassigned.forEach((student) => {
         // 서버가 내려준 팀 배정 정보가 이미 있으면 그걸 우선함(두 응답이 불일치할 경우의 방어)
         // 안 그러면 isDirty 계산이 틀어지고 저장 payload에서 이 학생이 팀에서 빠질 수 있음
         if (map.has(student.userId)) return;
         map.set(student.userId, {
            userId: student.userId,
            name: student.name,
            email: student.email,
            profileImgUrl: student.profileImgUrl,
            originalTeamId: null,
         });
      });
      return map;
   }, [serverTeams, unassigned]);

   const membersByTeamId = useMemo(() => {
      const map = new Map<number, MemberInfo[]>();
      draftTeams.forEach((team) => map.set(team.teamId, []));
      const unassignedList: MemberInfo[] = [];
      memberInfoByUserId.forEach((info) => {
         const targetTeamId = draftAssignment[info.userId] ?? null;
         if (targetTeamId === null || !map.has(targetTeamId)) {
            unassignedList.push(info);
         } else {
            map.get(targetTeamId)?.push(info);
         }
      });
      return { byTeam: map, unassignedList };
   }, [draftTeams, memberInfoByUserId, draftAssignment]);

   const isDirty = useMemo(() => {
      if (deletedTeamIds.length > 0) return true;
      if (draftTeams.some((t) => t.teamId < 0)) return true;
      const renamed = draftTeams.some((t) => {
         if (t.teamId < 0) return false;
         const server = serverTeams.find((s) => s.teamId === t.teamId);
         return server ? server.name !== t.name : false;
      });
      if (renamed) return true;
      let memberDirty = false;
      memberInfoByUserId.forEach((info) => {
         if ((draftAssignment[info.userId] ?? null) !== info.originalTeamId) memberDirty = true;
      });
      return memberDirty;
   }, [deletedTeamIds, draftTeams, serverTeams, memberInfoByUserId, draftAssignment]);

   const { guardedAction, isLeaveConfirmOpen, onConfirmLeave, onCancelLeave } = useLeaveGuard(isDirty);

   const moveDraft = (userId: number, targetTeamId: number | null) => {
      setDraftAssignment((prev) => ({ ...prev, [userId]: targetTeamId }));
   };

   // 팀 하나만 수정하는 API가 더 이상 없어(일괄 저장뿐), 이름 변경도 초안으로만 남았다가 저장 시 반영
   const handleRename = (teamId: number, name: string) => {
      setDraftTeams((prev) => prev.map((t) => (t.teamId === teamId ? { ...t, name } : t)));
   };

   const activePeriod = useMemo(
      () => periods.find((p) => p.teamPeriodId === activePeriodId) ?? null,
      [periods, activePeriodId],
   );

   // activePeriodId/reloadKey를 바꿔 재조회 effect를 트리거하는 곳들은, 
   // effect 본문이 아니라 여기(호출 시점)에서 로딩 상태를 미리 세팅(effect 안에서 동기 setState를 피하기 위함)
   const switchPeriod = (periodId: number) => {
      setIsLoading(true);
      setHasError(false);
      setActivePeriodId(periodId);
   };

   const reloadTeams = () => {
      setIsLoading(true);
      setHasError(false);
      setReloadKey((prev) => prev + 1);
   };

   const handleCreateTeam = (name: string) => {
      if (!activePeriod) return;
      const newId = nextDraftIdRef.current--;
      setDraftTeams((prev) => [
         ...prev,
         {
            teamId: newId,
            name,
            startDate: activePeriod.startDate,
            endDate: activePeriod.endDate,
            dissolved: false,
         },
      ]);
   };

   // 팀원이 있으면(TeamCard에서 인라인 확인을 거친 뒤) 전원 미배정으로 보내고 삭제
   const handleDeleteTeam = (teamId: number) => {
      setDraftTeams((prev) => prev.filter((t) => t.teamId !== teamId));
      if (teamId >= 0) {
         setDeletedTeamIds((prev) => (prev.includes(teamId) ? prev : [...prev, teamId]));
      }
      setDraftAssignment((prev) => {
         const next = { ...prev };
         Object.keys(next).forEach((key) => {
            const uid = Number(key);
            if (next[uid] === teamId) next[uid] = null;
         });
         return next;
      });
   };

   const handlePeriodSaved = (period: TeamPeriod) => {
      setIsPeriodAddOpen(false);
      const wasEditing = !!editingPeriod;
      setEditingPeriod(null);
      queryClient.setQueryData<TeamPeriod[]>(['teamPeriods'], (prev = []) => {
         const exists = prev.some((p) => p.teamPeriodId === period.teamPeriodId);
         return exists
            ? prev.map((p) => (p.teamPeriodId === period.teamPeriodId ? period : p))
            : [...prev, period];
      });
      if (!wasEditing) {
         guardedAction(() => switchPeriod(period.teamPeriodId));
      } else if (period.teamPeriodId === activePeriodId) {
         // 팀 카드에 표시되는 시작/종료일은 기간 편성 시점에 서버에서 물려받은 값이라, \
         // 기간의 날짜만 바뀌었을 땐 그 값만 로컬에서 갱신
         // reloadTeams()로 재조회하면 진행 중인 팀 구성 초안(이름 변경/삭제/팀원 이동)까지 서버 값으로 통째로 리셋됨
         setDraftTeams((prev) =>
            prev.map((t) => ({ ...t, startDate: period.startDate, endDate: period.endDate })),
         );
         setServerTeams((prev) =>
            prev.map((t) => ({ ...t, startDate: period.startDate, endDate: period.endDate })),
         );
      }
   };

   const handleEditPeriodClick = (period: TeamPeriod) => {
      setEditingPeriod(period);
   };

   const handleDeletePeriodClick = (period: TeamPeriod) => {
      if (period.teamPeriodId === activePeriodId && isDirty) {
         guardedAction(() => setDeletingPeriod(period));
      } else {
         setDeletingPeriod(period);
      }
   };

   const handleDeletePeriodConfirm = async () => {
      if (!deletingPeriod || isDeletingPeriodRef.current) return;
      isDeletingPeriodRef.current = true;
      setIsDeletingPeriod(true);
      try {
         await deleteTeamPeriod(deletingPeriod.teamPeriodId);
         toast.success('기간을 삭제했습니다.');
         const deletedId = deletingPeriod.teamPeriodId;
         const remaining = periods.filter((p) => p.teamPeriodId !== deletedId);
         setDeletingPeriod(null);
         queryClient.setQueryData(['teamPeriods'], remaining);
         if (deletedId === activePeriodId) {
            if (remaining.length > 0) {
               switchPeriod(remaining[remaining.length - 1].teamPeriodId);
            } else {
               setActivePeriodId(null);
               // 마지막 기간을 삭제했으니 이 기간에 속했던 팀 구성 초안/서버 데이터도 함께 비움
               setServerTeams([]);
               setDraftTeams([]);
               setDeletedTeamIds([]);
               setDraftAssignment({});
               setUnassigned([]);
            }
         }
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '기간 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isDeletingPeriodRef.current = false;
         setIsDeletingPeriod(false);
      }
   };

   const handleSaveClick = () => {
      if (!isDirty) return;
      // 매번 새로 열 때마다 기본값(체크)으로 시작
      setCreateChatChannel(true);
      setCreateNotionPage(true);
      setIsSaveConfirmOpen(true);
   };

   const handleConfirmSave = async () => {
      if (isSavingRef.current || activePeriodId == null) return;
      isSavingRef.current = true;
      setIsSaving(true);

      // payload 구성까지 try 안에 넣어야 함
      // 밖에 있으면 여기서 예외가 났을 때 finally를 못 타서 isSavingRef가 true로 눌러붙어, 
      // 이후로는 저장 버튼을 눌러도 조용히 아무 반응이 없어짐
      try {
         const teamsPayload: TeamConfigurationTeamInput[] = draftTeams.map((t) => ({
            teamId: t.teamId < 0 ? null : t.teamId,
            name: t.name,
            userIds: (membersByTeamId.byTeam.get(t.teamId) ?? []).map((m) => m.userId),
         }));

         const payload: TeamConfigurationRequest = {
            teamPeriodId: activePeriodId,
            teams: teamsPayload,
            deletedTeamIds: deletedTeamIds.length > 0 ? deletedTeamIds : undefined,
            // 저장 시점의 미배정 패널 전체를 매번 그대로 보냄(생략하지 않음)
            unassignedUserIds: membersByTeamId.unassignedList.map((m) => m.userId),
            createChatChannel,
            createNotionPage,
         };

         await updateTeamConfiguration(payload);
         setIsSaveConfirmOpen(false);
         toast.success('팀 구성을 저장했습니다.');
         reloadTeams();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSavingRef.current = false;
         setIsSaving(false);
      }
   };

   if (isLoadingPeriods) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <div className="flex items-center justify-between">
               <Skeleton width={100} height={28} className="rounded-md" />
               <div className="flex items-center gap-2">
                  <Skeleton width={90} height={36} className="rounded-xs" />
                  <Skeleton width={64} height={36} className="rounded-xs" />
               </div>
            </div>
            <div className="mt-5 flex gap-4 border-b border-gray-200 pb-3">
               <Skeleton width={64} height={20} className="rounded-md" />
               <Skeleton width={64} height={20} className="rounded-md" />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
               <Skeleton width="100%" height={280} className="rounded-xs" />
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                     <Skeleton key={i} width="100%" height={220} className="rounded-xs" />
                  ))}
               </div>
            </div>
         </div>
      );
   }

   if (periodsError) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <p className="py-16 text-center text-sm text-gray-400">기간 정보를 불러오지 못했습니다.</p>
         </div>
      );
   }

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">팀 관리</h1>
            <div className="flex items-center gap-2">
               <Link
                  href="/team/history"
                  className="flex cursor-pointer items-center gap-1.5 rounded-xs border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  <Clock size={14} />
                  이력 보기
               </Link>
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

         {periods.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-sm border border-dashed border-gray-300 bg-white py-16">
               <p className="text-sm text-gray-400">아직 생성된 기간이 없습니다.</p>
               <button
                  type="button"
                  onClick={() => setIsPeriodAddOpen(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A]"
               >
                  <Plus size={14} />
                  기간 추가
               </button>
            </div>
         ) : (
            <>
               {/* 이 페이지만 제목과 같은 줄에 "이력 보기"/"저장" 버튼 있으므로 6px 끌어올려 시각적으로 맞춘다 */}
               <div className="-mt-1.5">
                  <TeamPeriodTabs
                     periods={periods}
                     activePeriodId={activePeriodId}
                     onSelect={(periodId) => guardedAction(() => switchPeriod(periodId))}
                     onEditPeriod={handleEditPeriodClick}
                     onDeletePeriod={handleDeletePeriodClick}
                     trailing={
                        <button
                           type="button"
                           onClick={() => setIsPeriodAddOpen(true)}
                           className="flex cursor-pointer items-center gap-1 pb-3 text-sm font-medium text-brand-green hover:text-[#4D655A]"
                        >
                           <Plus size={14} />
                           기간 추가
                        </button>
                     }
                  />
               </div>

               {isLoading ? (
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                     <Skeleton width="100%" height={280} className="rounded-xs" />
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                           <Skeleton key={i} width="100%" height={220} className="rounded-xs" />
                        ))}
                     </div>
                  </div>
               ) : hasError ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                     <p className="text-sm text-gray-400">팀 정보를 불러오지 못했습니다.</p>
                     <button
                        type="button"
                        onClick={reloadTeams}
                        className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                     >
                        다시 시도
                     </button>
                  </div>
               ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                     <UnassignedPanel
                        students={membersByTeamId.unassignedList.map((info) => ({
                           userId: info.userId,
                           name: info.name,
                           email: info.email,
                           profileImgUrl: info.profileImgUrl,
                        }))}
                        teams={draftTeams}
                        isDragOver={dragOverTarget === 'unassigned'}
                        onDragOverChange={(isOver) => setDragOverTarget(isOver ? 'unassigned' : null)}
                        onDropUser={(userId) => moveDraft(userId, null)}
                        onDragStartUser={() => {}}
                        onMoveUserToTeam={(userId, targetTeamId) => moveDraft(userId, targetTeamId)}
                     />

                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {draftTeams.map((team) => (
                           <TeamCard
                              key={team.teamId}
                              team={team}
                              members={(membersByTeamId.byTeam.get(team.teamId) ?? []).map((info) => ({
                                 userId: info.userId,
                                 name: info.name,
                                 email: info.email,
                                 profileImgUrl: info.profileImgUrl,
                              }))}
                              allTeams={draftTeams}
                              isDragOver={dragOverTarget === team.teamId}
                              onDragOverChange={(isOver) => setDragOverTarget(isOver ? team.teamId : null)}
                              onRename={handleRename}
                              onDeleteTeam={handleDeleteTeam}
                              onDropUser={(userId) => moveDraft(userId, team.teamId)}
                              onDragStartUser={() => {}}
                              onMoveUserToTeam={(userId, targetTeamId) => moveDraft(userId, targetTeamId)}
                              onUnassignUser={(userId) => moveDraft(userId, null)}
                           />
                        ))}

                        <TeamAddCard
                           existingNames={draftTeams.map((t) => t.name)}
                           onCreate={handleCreateTeam}
                        />
                     </div>
                  </div>
               )}
            </>
         )}

         {(isPeriodAddOpen || editingPeriod) && (
            <TeamPeriodAddModal
               existingPeriods={periods}
               editTarget={editingPeriod ?? undefined}
               onClose={() => {
                  setIsPeriodAddOpen(false);
                  setEditingPeriod(null);
               }}
               onSaved={handlePeriodSaved}
            />
         )}

         <ConfirmModal
            open={!!deletingPeriod}
            title="기간을 삭제할까요?"
            description="해당 기간에 배정된 훈련생이 없어야 삭제할 수 있으며, 삭제하면 복구할 수 없습니다."
            variant="danger"
            confirmLabel={isDeletingPeriod ? '삭제 중...' : '삭제'}
            busy={isDeletingPeriod}
            onConfirm={handleDeletePeriodConfirm}
            onClose={() => setDeletingPeriod(null)}
         />

         <ConfirmModal
            open={isSaveConfirmOpen}
            title="팀 구성 내용을 저장하시겠습니까?"
            description="현재 팀 배정 결과를 바탕으로 아래의 선택에 따라 단체 채팅방과 Notion 페이지가 생성됩니다."
            confirmLabel={isSaving ? '저장 중...' : '저장'}
            busy={isSaving}
            onConfirm={handleConfirmSave}
            onClose={() => setIsSaveConfirmOpen(false)}
         >
            <div className="mt-4 flex flex-col gap-2 text-left">
               <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-brand-gold/40 bg-brand-cream/40 p-3 text-xs text-gray-700">
                  <input
                     type="checkbox"
                     checked={createChatChannel}
                     onChange={(e) => setCreateChatChannel(e.target.checked)}
                     className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-green"
                  />
                  단체 채팅방 생성
               </label>
               <label className="flex cursor-pointer items-start gap-2 rounded-sm border border-brand-gold/40 bg-brand-cream/40 p-3 text-xs text-gray-700">
                  <input
                     type="checkbox"
                     checked={createNotionPage}
                     onChange={(e) => setCreateNotionPage(e.target.checked)}
                     className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-green"
                  />
                  Notion 페이지 생성
               </label>
            </div>
         </ConfirmModal>

         <ConfirmModal
            open={isLeaveConfirmOpen}
            title="저장하지 않은 변경사항이 있습니다"
            description="지금 나가면 변경사항이 저장되지 않습니다. 그래도 나가시겠습니까?"
            confirmLabel="나가기"
            variant="danger"
            onConfirm={onConfirmLeave}
            onClose={onCancelLeave}
         />
      </div>
   );
}
