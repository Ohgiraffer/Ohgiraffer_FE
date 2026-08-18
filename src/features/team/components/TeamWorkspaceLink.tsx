'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getTeamWorkspace } from '@/services/team.service';

interface TeamWorkspaceLinkProps {
   teamId: number;
}

// 팀 카드 하단에 공통으로 쓰는 Notion 협업 문서 링크. teamId가 음수면(이번 세션에 추가했지만
// 아직 저장 안 한 임시 팀) 서버에 실제로 존재하지 않으니 조회 자체를 하지 않는다
export default function TeamWorkspaceLink({ teamId }: TeamWorkspaceLinkProps) {
   const [workspaceUrl, setWorkspaceUrl] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(teamId >= 0);
   // teamId가 바뀌면(현재 호출부는 항상 key={teamId}로 리마운트하지만, 재사용되는 인스턴스에서도
   // 안전하도록) 렌더 중에 이전 팀의 workspaceUrl을 먼저 비운다 - 이펙트 안에서 동기 setState를
   // 하면 안 되므로, React가 권장하는 "prop 변경에 맞춰 렌더 중 상태 조정" 패턴을 쓴다
   const [trackedTeamId, setTrackedTeamId] = useState(teamId);
   if (teamId !== trackedTeamId) {
      setTrackedTeamId(teamId);
      setWorkspaceUrl(null);
      setIsLoading(teamId >= 0);
   }

   useEffect(() => {
      if (teamId < 0) return;
      let isMounted = true;
      getTeamWorkspace(teamId)
         .then((data) => {
            if (isMounted) setWorkspaceUrl(data.workspaceUrl);
         })
         .catch(() => {
            // 조회 실패는 조용히 "아직 없음"과 동일하게 취급 - 보조 정보라 에러를 따로 안 띄운다
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [teamId]);

   if (teamId < 0) {
      return (
         <div className="mt-3 flex items-center justify-between rounded-xs border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-400">
            <span>Notion 페이지</span>
            <span className="flex h-5 items-center rounded-xs bg-gray-100 px-2 font-medium">
               저장 후 생성
            </span>
         </div>
      );
   }

   if (isLoading) {
      return (
         <div className="mt-3 flex items-center justify-between rounded-xs border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-400">
            <span>Notion 페이지</span>
            <span className="flex h-5 items-center rounded-xs bg-gray-100 px-2 font-medium">
               확인 중
            </span>
         </div>
      );
   }

   if (!workspaceUrl) {
      return (
         <div className="mt-3 flex items-center justify-between rounded-xs border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-400">
            <span>Notion 페이지</span>
            <span className="flex h-5 items-center rounded-xs bg-gray-100 px-2 font-medium">
               아직 없음
            </span>
         </div>
      );
   }

   return (
      <a
         href={workspaceUrl}
         target="_blank"
         rel="noopener noreferrer"
         className="mt-3 flex items-center justify-between rounded-xs border border-gray-200 px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-50"
      >
         <span>Notion 페이지</span>
         {/* 나머지 상태(아직 없음/확인 중/저장 후 생성)의 배지와 높이(h-5)를 고정으로 맞춘다 -
         패딩만 맞추면 텍스트 배지(line-height 기준)와 아이콘(고정 12px)의 실제 높이가 미묘하게
         달라서, 팀 카드 목록을 스크롤할 때 카드 높이가 덜컥거렸다 */}
         <span className="flex h-5 items-center justify-center rounded-xs bg-gray-100 px-2">
            <ExternalLink size={12} className="shrink-0 text-gray-400" />
         </span>
      </a>
   );
}
