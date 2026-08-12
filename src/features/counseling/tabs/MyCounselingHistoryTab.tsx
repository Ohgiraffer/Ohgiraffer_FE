'use client';

import { format, parseISO } from 'date-fns';
import CounselingStatusBadge from '../components/CounselingStatusBadge';
import CounselingDetailModal from '../components/CounselingDetailModal';
import { useMyCounselingHistory } from '../hooks/useMyCounselingHistory';

// 훈련생 "내 상담 이력" 탭 - 예정·완료 상담 목록, 행을 클릭하면 상세 모달이 뜬다
export default function MyCounselingHistoryTab() {
   const { items, isLoading, loadError, detail, openDetail, closeDetail } =
      useMyCounselingHistory();

   return (
      <div>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[8%] px-8 py-3 text-center font-medium">#</th>
                     <th className="w-[32%] px-10 py-3 font-medium">상담 주제</th>
                     <th className="w-[15%] px-6 py-3 font-medium">담당자</th>
                     <th className="w-[25%] px-6 py-3 text-center font-medium">일시</th>
                     <th className="w-[20%] px-6 py-3 text-center font-medium">상태</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                           불러오는 중...
                        </td>
                     </tr>
                  ) : loadError ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-brand-red">
                           {loadError}
                        </td>
                     </tr>
                  ) : items.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                           상담 이력이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     items.map((item, index) => (
                        <tr
                           key={item.consultationId}
                           onClick={() => openDetail(item.consultationId)}
                           className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                        >
                           <td className="px-8 py-4 text-center text-gray-500">{index + 1}</td>
                           <td className="px-10 py-4 font-medium text-gray-900">{item.topic}</td>
                           <td className="px-6 py-4 text-gray-700">{item.counselorName}</td>
                           <td className="px-15 py-4 text-center text-gray-500">
                              {format(parseISO(item.scheduledAt), 'yyyy.MM.dd HH:mm')}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <CounselingStatusBadge status={item.status} />
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>

         {detail && <CounselingDetailModal detail={detail} onClose={closeDetail} />}
      </div>
   );
}
