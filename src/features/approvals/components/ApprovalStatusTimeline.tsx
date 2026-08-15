'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalStatus } from '@/services/approval.service';
import { formatApprovalDate, formatApprovalDateTime } from '../formatApprovalDate';

type Props = {
   status: ApprovalStatus;
   approverName: string | null;
   confirmedAt: string | null;
   processedAt: string | null;
};

const FINAL_STEP_LABEL: Record<ApprovalStatus, string> = {
   PENDING: '처리 완료',
   CHECKED: '처리 완료',
   APPROVED: '승인',
   REJECTED: '반려',
   COMPLETED: '처리 완료',
};

function formatStepDate(iso: string, withTime: boolean) {
   return withTime ? formatApprovalDateTime(iso) : formatApprovalDate(iso);
}

// 결재 이력 상세 상단의 4단계 진행바 - 신청 완료 → 대기 → 확인 중 → 승인/반려
export default function ApprovalStatusTimeline({
   status,
   approverName,
   confirmedAt,
   processedAt,
}: Props) {
   const isChecked = status !== 'PENDING';
   const isFinal = status === 'APPROVED' || status === 'REJECTED' || status === 'COMPLETED';
   const isRejected = status === 'REJECTED';

   const steps = [
      { label: '신청 완료', done: true, caption: null as string | null, isRejectedFinal: false },
      { label: '대기', done: true, caption: null as string | null, isRejectedFinal: false },
      {
         label: '확인 중',
         done: isChecked,
         caption:
            isChecked && approverName && confirmedAt
               ? `${approverName} · ${formatStepDate(confirmedAt, true)}`
               : null,
         isRejectedFinal: false,
      },
      {
         label: FINAL_STEP_LABEL[status],
         done: isFinal,
         caption: isFinal && processedAt ? formatStepDate(processedAt, true) : null,
         isRejectedFinal: isFinal && isRejected,
      },
   ];

   const connectorDoneBefore = (index: number) => steps[index].done;

   return (
      <div className="flex items-start">
         {steps.map((step, index) => {
            const isFirst = index === 0;
            const isLast = index === steps.length - 1;

            return (
               <div key={index} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                     <div
                        className={cn(
                           'h-px flex-1',
                           isFirst
                              ? 'invisible'
                              : connectorDoneBefore(index)
                                ? 'bg-brand-green'
                                : 'bg-gray-200',
                        )}
                     />
                     <div
                        className={cn(
                           'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                           !step.done
                              ? 'border-2 border-gray-200 bg-white'
                              : step.isRejectedFinal
                                ? 'bg-brand-red text-white'
                                : 'bg-brand-green text-white',
                        )}
                     >
                        {step.done &&
                           (step.isRejectedFinal ? <X size={14} /> : <Check size={14} />)}
                     </div>
                     <div
                        className={cn(
                           'h-px flex-1',
                           isLast
                              ? 'invisible'
                              : connectorDoneBefore(index + 1)
                                ? 'bg-brand-green'
                                : 'bg-gray-200',
                        )}
                     />
                  </div>

                  <span
                     className={cn(
                        'mt-2 text-sm font-semibold whitespace-nowrap',
                        step.done ? 'text-gray-900' : 'text-gray-400',
                     )}
                  >
                     {step.label}
                  </span>
                  {step.caption && (
                     <span
                        className={cn(
                           'mt-1 text-xs whitespace-nowrap',
                           step.isRejectedFinal ? 'text-brand-red' : 'text-gray-400',
                        )}
                     >
                        {step.caption}
                     </span>
                  )}
               </div>
            );
         })}
      </div>
   );
}
