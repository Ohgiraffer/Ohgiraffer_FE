'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Plus } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { setUnsavedChangesChecker } from '@/lib/navigationGuard';
import {
   getTeams,
   getTeamPeriods,
   getUnassignedStudents,
   updateTeamConfiguration,
} from '@/services/team.service';
import TeamCard from './TeamCard';
import UnassignedPanel from './UnassignedPanel';
import TeamAddCard from './TeamAddCard';
import TeamPeriodTabs from './TeamPeriodTabs';
import TeamPeriodAddModal from './TeamPeriodAddModal';
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
   email: string;
   originalTeamId: number | null;
}

export default function ManagerTeamBoard() {
   const [periods, setPeriods] = useState<TeamPeriod[]>([]);
   const [isLoadingPeriods, setIsLoadingPeriods] = useState(true);
   const [periodsError, setPeriodsError] = useState(false);
   const [activePeriodId, setActivePeriodId] = useState<number | null>(null);
   const [isPeriodAddOpen, setIsPeriodAddOpen] = useState(false);

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
   const isSavingRef = useRef(false);

   // 1) 편성 기간 목록 - 최초 1회만 조회, 없으면 마지막(최신) 기간을 기본 선택
   useEffect(() => {
      let isMounted = true;
      getTeamPeriods()
         .then((result) => {
            if (!isMounted) return;
            setPeriods(result);
            setActivePeriodId(result.length > 0 ? result[result.length - 1].teamPeriodId : null);
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

   // 2) 선택된 기간의 팀/미배정 목록 - 기간이 바뀌거나 저장 성공(reloadKey) 후 다시 불러오고,
   // 매번 초안을 서버 값으로 완전히 리셋한다(개별 API가 없어져 "초안 유지한 채 일부만 갱신"할 일이 없음)
   useEffect(() => {
      // activePeriodId가 null인 건 아직 기간 목록 로딩 중이거나(그때는 상위 isLoadingPeriods
      // 분기가 화면을 대신 채움) 기간이 아예 없는 경우(그때는 빈 상태 분기가 이 섹션을 안 그림)뿐이라,
      // 이 effect가 실제로 렌더링되는 상황에서는 도달하지 않는다 - 여기선 그냥 아무 것도 안 하고 끝낸다
      if (activePeriodId == null) return;
      let isMounted = true;
      // isLoading/hasError는 이 effect가 아니라, activePeriodId/reloadKey를 바꾸는
      // 이벤트 핸들러 쪽(switchPeriod/reloadTeams)에서 미리 세팅한다
      Promise.all([getTeams(activePeriodId), getUnassignedStudents()])
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
               name: member.name,
               email: member.email,
               originalTeamId: team.teamId,
            });
         });
      });
      unassigned.forEach((student) => {
         map.set(student.userId, {
            userId: student.userId,
            name: student.name,
            email: student.email,
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

   // 저장 안 한 변경사항이 있는 채로 화면을 떠나려는 시도(뒤로가기, 기간 탭 전환)를 공통으로 가드한다.
   // dirty가 아니면 바로 실행하고, dirty면 실행을 보류해뒀다가 확인 모달에서 승인해야 실행한다
   const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
   const pendingActionRef = useRef<(() => void) | null>(null);

   const guardedAction = (fn: () => void) => {
      if (!isDirty) {
         fn();
         return;
      }
      pendingActionRef.current = fn;
      setIsLeaveConfirmOpen(true);
   };

   const handleConfirmLeave = () => {
      setIsLeaveConfirmOpen(false);
      const fn = pendingActionRef.current;
      pendingActionRef.current = null;
      fn?.();
   };

   const handleCancelLeave = () => {
      setIsLeaveConfirmOpen(false);
      pendingActionRef.current = null;
   };

   // 브라우저 뒤로가기 대응: dirty 상태로 들어가는 시점에 같은 주소로 더미 히스토리를 하나 쌓아둔다.
   // 뒤로가기를 누르면 popstate가 뜨는데, 그때 다시 더미를 쌓아 실제 이동을 취소하고 확인을 받는다
   const guardPushedRef = useRef(false);

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
         guardedAction(() => {
            guardPushedRef.current = false;
            window.history.go(-2);
         });
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [isDirty]);

   const moveDraft = (userId: number, targetTeamId: number | null) => {
      setDraftAssignment((prev) => ({ ...prev, [userId]: targetTeamId }));
   };

   // 팀 하나만 수정하는 API가 더 이상 없어(일괄 저장뿐), 이름 변경도 초안으로만 남았다가 저장 시 반영된다
   const handleRename = (teamId: number, name: string) => {
      setDraftTeams((prev) => prev.map((t) => (t.teamId === teamId ? { ...t, name } : t)));
   };

   const activePeriod = useMemo(
      () => periods.find((p) => p.teamPeriodId === activePeriodId) ?? null,
      [periods, activePeriodId],
   );

   // activePeriodId/reloadKey를 바꿔 재조회 effect를 트리거하는 곳들은, effect 본문이 아니라
   // 여기(호출 시점)에서 로딩 상태를 미리 세팅한다(effect 안에서 동기 setState를 피하기 위함)
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
         { teamId: newId, name, startDate: activePeriod.startDate, endDate: activePeriod.endDate },
      ]);
   };

   // 팀원이 있으면(TeamCard에서 인라인 확인을 거친 뒤) 전원 미배정으로 보내고 삭제한다
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

   const handlePeriodCreated = (period: TeamPeriod) => {
      setIsPeriodAddOpen(false);
      setPeriods((prev) => [...prev, period]);
      guardedAction(() => switchPeriod(period.teamPeriodId));
   };

   const handleSaveClick = () => {
      if (!isDirty) return;
      // 매번 새로 열 때마다 기본값(체크)으로 시작한다
      setCreateChatChannel(true);
      setCreateNotionPage(true);
      setIsSaveConfirmOpen(true);
   };

   const handleConfirmSave = async () => {
      if (isSavingRef.current || activePeriodId == null) return;
      isSavingRef.current = true;

      // payload 구성까지 try 안에 넣어야 한다 - 밖에 있으면 여기서 예외가 났을 때 finally를
      // 못 타서 isSavingRef가 true로 눌러붙어, 이후로는 저장 버튼을 눌러도 조용히 아무 반응이 없어진다
      try {
         const teamsPayload: TeamConfigurationTeamInput[] = draftTeams.map((t) => ({
            teamId: t.teamId < 0 ? null : t.teamId,
            name: t.name,
            memberUserIds: (membersByTeamId.byTeam.get(t.teamId) ?? []).map((m) => m.userId),
         }));

         const payload: TeamConfigurationRequest = {
            teamPeriodId: activePeriodId,
            teams: teamsPayload,
            deletedTeamIds: deletedTeamIds.length > 0 ? deletedTeamIds : undefined,
            // 저장 시점의 미배정 패널 전체를 매번 그대로 보낸다(생략하지 않음)
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
      }
   };

   if (isLoadingPeriods) {
      return (
         <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
            <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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
            <h1 className="text-lg font-bold text-gray-900">팀 관리</h1>
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
               <TeamPeriodTabs
                  periods={periods}
                  activePeriodId={activePeriodId}
                  onSelect={(periodId) => guardedAction(() => switchPeriod(periodId))}
                  trailing={
                     <button
                        type="button"
                        onClick={() => setIsPeriodAddOpen(true)}
                        className="flex cursor-pointer items-center gap-1 pb-3 text-sm font-medium text-gray-400 hover:text-gray-600"
                     >
                        <Plus size={14} />
                        기간 추가
                     </button>
                  }
               />

               {isLoading ? (
                  <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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

         {isPeriodAddOpen && (
            <TeamPeriodAddModal
               existingPeriods={periods}
               onClose={() => setIsPeriodAddOpen(false)}
               onCreated={handlePeriodCreated}
            />
         )}

         <ConfirmModal
            open={isSaveConfirmOpen}
            title="팀 구성 내용을 저장하시겠습니까?"
            description="현재 팀 배정 결과를 바탕으로 아래의 선택에 따라 단체 채팅방과 Notion 페이지가 생성됩니다."
            confirmLabel="저장"
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
            onConfirm={handleConfirmLeave}
            onClose={handleCancelLeave}
         />
      </div>
   );
}
