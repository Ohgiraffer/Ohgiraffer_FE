import ChatAvatar from '@/features/chat/components/ChatAvatar';
import TeamWorkspaceLink from '../TeamWorkspaceLink';
import type { TeamHistorySnapshotTeam } from '../../types';

interface TeamCompositionCardProps {
   team: TeamHistorySnapshotTeam;
}

export default function TeamCompositionCard({ team }: TeamCompositionCardProps) {
   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white p-4">
         <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">{team.teamName}</span>
            <span className="rounded-xs bg-[#EAF3EC] px-2 py-0.5 text-xs font-medium text-brand-green">
               {team.memberCount}명
            </span>
         </div>
         <div className="mt-3 flex flex-col gap-2">
            {team.members.length === 0 ? (
               <p className="py-4 text-center text-xs text-gray-300">배정 없음</p>
            ) : (
               team.members.map((member) => (
                  <div key={member.userId} className="flex items-center gap-2">
                     <ChatAvatar name={member.userName} imageUrl={member.profileImgUrl} size="sm" />
                     <span className="truncate text-sm text-gray-700">
                        {member.userName || '이름 없음'}
                     </span>
                  </div>
               ))
            )}
         </div>

         <TeamWorkspaceLink teamId={team.teamId} />
      </div>
   );
}
