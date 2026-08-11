'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getTeamWorkspace } from '@/services/team.service';

interface TeamWorkspaceLinkProps {
   teamId: number;
}

// notionPageId만 내려오고 URL은 안 내려오므로 직접 조립한다. 대시(-)는 있어도 없어도 Notion이
// 인식하지만, 없는 형태가 Notion이 실제로 공유 링크에 쓰는 정식 형태라 그에 맞춘다
function buildNotionUrl(pageId: string) {
   return `https://www.notion.so/${pageId.replace(/-/g, '')}`;
}

// 팀 카드 하단에 공통으로 쓰는 Notion 협업 문서 링크. teamId가 음수면(이번 세션에 추가했지만
// 아직 저장 안 한 임시 팀) 서버에 실제로 존재하지 않으니 조회 자체를 하지 않는다
export default function TeamWorkspaceLink({ teamId }: TeamWorkspaceLinkProps) {
   const [notionPageId, setNotionPageId] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(teamId >= 0);

   useEffect(() => {
      if (teamId < 0) return;
      let isMounted = true;
      getTeamWorkspace(teamId)
         .then((data) => {
            if (isMounted) setNotionPageId(data.notionPageId);
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
            <span className="rounded-xs bg-gray-100 px-2 py-0.5 font-medium">저장 후 생성</span>
         </div>
      );
   }

   if (isLoading) {
      return (
         <div className="mt-3 flex items-center justify-between rounded-xs border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-400">
            <span>Notion 페이지</span>
            <span className="rounded-xs bg-gray-100 px-2 py-0.5 font-medium">확인 중</span>
         </div>
      );
   }

   if (!notionPageId) {
      return (
         <div className="mt-3 flex items-center justify-between rounded-xs border border-dashed border-gray-200 px-2.5 py-2 text-xs text-gray-400">
            <span>Notion 페이지</span>
            <span className="rounded-xs bg-gray-100 px-2 py-0.5 font-medium">아직 없음</span>
         </div>
      );
   }

   return (
      <a
         href={buildNotionUrl(notionPageId)}
         target="_blank"
         rel="noopener noreferrer"
         className="mt-3 flex items-center justify-between rounded-xs border border-gray-200 px-2.5 py-2 text-xs text-gray-600 hover:bg-gray-50"
      >
         <span>Notion 페이지</span>
         <ExternalLink size={12} className="shrink-0 text-gray-400" />
      </a>
   );
}
