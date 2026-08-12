import type { TraineeTeamHistoryEntry } from '../../types';

export default function TeamDetailTab({ teams }: { teams: TraineeTeamHistoryEntry[] }) {
   return (
      <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[40%] px-6 py-3 font-medium">팀명</th>
                  <th className="w-[60%] px-6 py-3 font-medium">활동 기간</th>
               </tr>
            </thead>
            <tbody>
               {teams.length === 0 ? (
                  <tr>
                     <td colSpan={2} className="px-6 py-10 text-center text-gray-400">
                        참여한 팀이 없습니다.
                     </td>
                  </tr>
               ) : (
                  teams.map((team, index) => (
                     <tr key={index} className="border-b border-[#F3F4F6] last:border-b-0">
                        <td className="px-6 py-4 font-medium text-gray-900">{team.teamName}</td>
                        <td className="px-6 py-4 text-gray-700">{team.activePeriod}</td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
