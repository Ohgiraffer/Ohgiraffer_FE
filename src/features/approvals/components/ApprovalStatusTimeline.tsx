'use client';

import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ApprovalStatus } from '@/services/approval.service';

type Props = {
   status: ApprovalStatus;
   approverName: string | null;
   confirmedAt: string | null;
   processedAt: string | null;
   // 확인 처리한 담당자 이름·시각은 결재를 처리하는 강사/매니저 화면에서만 보여주고, 결재를 올린
   // 신청자 본인 화면에는 노출하지 않는다(기획 확정사항) - 기본값은 숨김
   showCheckerCaption?: boolean;
};

// 아직 승인/반려가 결정되지 않은 상태에서 보여줄 마지막 단계 자리표시 라벨
const FINAL_STEP_LABEL: Record<ApprovalStatus, string> = {
   PENDING: '처리 완료',
   CHECKED: '처리 완료',
   APPROVED: '승인',
   REJECTED: '반려',
   COMPLETED: '처리 완료',
};

function formatStepDate(iso: string, withTime: boolean) {
   return format(new Date(iso), withTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd');
}

// 결재 이력 상세 상단의 4단계 진행바 - 신청 완료 → 대기 → 확인 중 → 승인/반려.
// 신청 완료 후 곧바로 대기 상태로 넘어가는 정책이라 이 둘은 결재가 존재하는 한 항상 완료 상태.
// 확인 처리 이후 단계(캡션 포함)는 최종 결정(승인/반려)이 나도 계속 보여준다 - "누가 언제 확인했는지"는
// 처리 완료 후에도 유효한 정보라서 최종 단계가 생겼다고 사라지면 안 됨
export default function ApprovalStatusTimeline({
   status,
   approverName,
   confirmedAt,
   processedAt,
   showCheckerCaption = false,
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
            showCheckerCaption && isChecked && approverName && confirmedAt
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

   // 단계 i-1과 i를 잇는 연결선의 완료 여부. 각 단계의 "왼쪽 절반"과 이전 단계의 "오른쪽 절반"이
   // 같은 값을 참조해야 두 절반이 이어졌을 때 하나의 선처럼 보인다
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
