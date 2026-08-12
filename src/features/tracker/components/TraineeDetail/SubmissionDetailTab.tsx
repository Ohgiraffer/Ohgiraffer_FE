import StatusBadge from '@/features/submissions/components/StatusBadge';
import type { TraineeSubmissionEntry } from '../../types';

export default function SubmissionDetailTab({
   submissions,
}: {
   submissions: TraineeSubmissionEntry[];
}) {
   return (
      <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
         <table className="w-full table-fixed text-left text-sm">
            <thead>
               <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                  <th className="w-[45%] px-6 py-3 font-medium">제출함</th>
                  <th className="w-[25%] px-6 py-3 font-medium">제출 여부</th>
                  <th className="w-[30%] px-6 py-3 font-medium">제출 시각</th>
               </tr>
            </thead>
            <tbody>
               {submissions.length === 0 ? (
                  <tr>
                     <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                        제출함이 없습니다.
                     </td>
                  </tr>
               ) : (
                  submissions.map((submission, index) => (
                     <tr key={index} className="border-b border-[#F3F4F6] last:border-b-0">
                        <td className="px-6 py-4 font-medium text-gray-900">{submission.boxName}</td>
                        <td className="px-6 py-4">
                           <StatusBadge tone={submission.status === '제출완료' ? 'success' : 'danger'}>
                              {submission.status}
                           </StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{submission.submittedAt ?? '—'}</td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
   );
}
