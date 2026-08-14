'use client';

import { format, isValid, parseISO } from 'date-fns';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { useStudentSubmissionHistory } from '../../hooks/useStudentSubmissionHistory';
import type {
   SubmissionHistorySourceType,
   SubmissionHistoryStatus,
} from '@/services/studentSubmissionHistory.service';

const SOURCE_TYPE_LABELS: Record<SubmissionHistorySourceType, string> = {
   SUBMISSION_BOX: '제출함',
   SURVEY_FORM: '설문',
};

const STATUS_LABELS: Record<SubmissionHistoryStatus, string> = {
   SUBMITTED: '제출완료',
   NOT_SUBMITTED: '미제출',
   RESPONDED: '응답완료',
   NOT_RESPONDED: '미응답',
   RESPONSE_CHECK_FAILED: '확인 실패',
};

// Google Forms API 자체의 오류(호출 실패/한도 초과) - 훈련생의 제출·응답 상태와는 무관한 문제라
// 일반적인 "불러오지 못했습니다" 대신 원인을 구분해서 안내한다
const GOOGLE_FORMS_ERROR_CODES = new Set(['FORM_003', 'FORM_004']);

function formatDateTime(value: string | null) {
   if (!value) return '—';
   const date = parseISO(value);
   return isValid(date) ? format(date, 'yyyy.MM.dd HH:mm') : '—';
}

export default function SubmissionDetailTab({ traineeId }: { traineeId: number }) {
   const { data, isLoading, error, errorCode, retry } = useStudentSubmissionHistory(traineeId);

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (error || !data) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">
               {errorCode && GOOGLE_FORMS_ERROR_CODES.has(errorCode)
                  ? 'Google Forms 연동에 문제가 발생해 설문 이력을 불러오지 못했습니다.'
                  : '제출·설문 이력을 불러오지 못했습니다.'}
            </p>
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
      <div>
         <p className="mb-3 text-xs text-gray-400">
            전체 {data.totalCount}건 중{' '}
            <span className="font-semibold text-gray-700">{data.completedCount}건</span> 완료
         </p>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[15%] px-6 py-3 font-medium">구분</th>
                     <th className="w-[35%] px-3 py-3 font-medium">제목</th>
                     <th className="w-[15%] px-3 py-3 font-medium">상태</th>
                     <th className="w-[20%] px-3 py-3 font-medium">완료 시각</th>
                     <th className="w-[15%] px-3 py-3 font-medium">마감일</th>
                  </tr>
               </thead>
               <tbody>
                  {data.items.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                           제출함/설문 이력이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     data.items.map((item) => (
                        <tr
                           key={`${item.sourceType}-${item.targetId}`}
                           className="border-b border-[#F3F4F6] last:border-b-0"
                        >
                           <td className="px-6 py-4">
                              <StatusBadge tone={item.sourceType === 'SUBMISSION_BOX' ? 'neutral' : 'muted'}>
                                 {SOURCE_TYPE_LABELS[item.sourceType]}
                              </StatusBadge>
                           </td>
                           <td className="px-3 py-4 font-medium text-gray-900">{item.title}</td>
                           <td className="px-3 py-4">
                              <StatusBadge tone={item.completed ? 'success' : 'danger'}>
                                 {STATUS_LABELS[item.status]}
                              </StatusBadge>
                           </td>
                           <td className="px-3 py-4 text-gray-700">
                              {formatDateTime(item.completedAt)}
                              {item.late && <span className="ml-1 text-xs text-brand-red">(지각)</span>}
                           </td>
                           <td className="px-3 py-4 text-gray-700">{formatDateTime(item.dueAt)}</td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
   );
}
