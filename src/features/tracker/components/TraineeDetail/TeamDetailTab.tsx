'use client';

import { formatTeamPeriod } from '@/features/team/formatTeamDate';
import { useTraineeTeamHistories } from '../../hooks/useTraineeTeamHistories';

export default function TeamDetailTab({ traineeId }: { traineeId: number }) {
   const { histories, isLoading, error, retry } = useTraineeTeamHistories(traineeId);

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (error) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">팀 배정 이력을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={retry}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }

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
               {histories.length === 0 ? (
                  <tr>
                     <td colSpan={2} className="px-6 py-10 text-center text-gray-400">
                        참여한 팀이 없습니다.
                     </td>
                  </tr>
               ) : (
                  histories.map((history) => (
                     <tr key={history.teamId} className="border-b border-[#F3F4F6] last:border-b-0">
                        <td className="px-6 py-4 font-medium text-gray-900">{history.teamName}</td>
                        <td className="px-6 py-4 text-gray-700">
                           {formatTeamPeriod(history.startDate, history.endDate)}
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
