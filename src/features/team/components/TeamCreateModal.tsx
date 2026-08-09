'use client';

import { useState } from 'react';
import { isValid, parse } from 'date-fns';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { createTeam } from '@/services/team.service';
import { formatTeamPeriod } from '../formatTeamDate';
import type { Team } from '../types';

// DatePicker는 마스크 입력이 끝나기 전(예: "2025-06-0")에도 onChange를 호출하므로,
// 열 자리가 다 채워진 유효한 날짜인지 별도로 확인해야 한다
function isCompleteDate(value: string) {
   return value.length === 10 && isValid(parse(value, 'yyyy-MM-dd', new Date()));
}

interface TeamCreateModalProps {
   existingTeams: Team[];
   onClose: () => void;
   onCreated: () => void;
}

export default function TeamCreateModal({
   existingTeams,
   onClose,
   onCreated,
}: TeamCreateModalProps) {
   const referenceTeam = existingTeams[0];
   const hasReusablePeriod = !!(referenceTeam?.startDate && referenceTeam?.endDate);

   const [name, setName] = useState('');
   const [isEditingPeriod, setIsEditingPeriod] = useState(!hasReusablePeriod);
   const [startDate, setStartDate] = useState(hasReusablePeriod ? referenceTeam!.startDate! : '');
   const [endDate, setEndDate] = useState(hasReusablePeriod ? referenceTeam!.endDate! : '');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const isStartDateComplete = isCompleteDate(startDate);
   const isEndDateComplete = isCompleteDate(endDate);
   const isDateRangeInvalid = isStartDateComplete && isEndDateComplete && endDate < startDate;
   const canSubmit =
      name.trim().length > 0 &&
      isStartDateComplete &&
      isEndDateComplete &&
      !isDateRangeInvalid &&
      !isSubmitting;

   const handleSubmit = async () => {
      if (!canSubmit) return;
      setIsSubmitting(true);
      try {
         await createTeam({ name: name.trim(), startDate, endDate });
         toast.success('팀을 생성했습니다.');
         onCreated();
      } catch (err) {
         if (err instanceof ApiError && err.code === 'TEAM_003') {
            toast.error(err.message);
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '팀 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Modal
         onClose={onClose}
         ariaLabel="팀 추가"
         panelClassName="w-full max-w-md"
         closeOnBackdropClick={false}
      >
         <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">팀 추가</h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         <div className="mt-5">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               팀명 <span className="font-bold text-brand-gold">*</span>
            </label>
            <input
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="팀명을 입력해주세요"
               className="mt-2 h-10 w-full rounded-sm border border-[#E5E7EB] px-4 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>

         <div className="mt-4">
            {isEditingPeriod ? (
               <>
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                     기간 <span className="font-bold text-brand-gold">*</span>
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                     <DatePicker value={startDate} onChange={setStartDate} placeholder="시작 일자" />
                     <div>
                        <DatePicker value={endDate} onChange={setEndDate} placeholder="종료 일자" />
                        {isDateRangeInvalid && (
                           <p className="mt-1 text-xs text-brand-red">
                              종료일은 시작일보다 빠를 수 없습니다
                           </p>
                        )}
                     </div>
                  </div>
               </>
            ) : (
               <>
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                     기간 <span className="font-bold text-brand-gold">*</span>
                  </label>
                  <div className="mt-2 flex items-center justify-between rounded-sm border border-[#E5E7EB] px-4 py-2.5 text-sm text-gray-900">
                     <span>{formatTeamPeriod(startDate, endDate)}</span>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">기존 팀과 동일</span>
                        <button
                           type="button"
                           onClick={() => setIsEditingPeriod(true)}
                           className="cursor-pointer text-xs font-semibold text-brand-green hover:underline"
                        >
                           변경
                        </button>
                     </div>
                  </div>
               </>
            )}
            <p className="mt-1.5 text-xs text-gray-400">팀원 배정은 팀 생성 후 진행할 수 있습니다.</p>
         </div>

         <div className="mt-6 flex justify-end gap-2">
            <button
               type="button"
               onClick={handleSubmit}
               disabled={!canSubmit}
               className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               {isSubmitting ? '추가 중...' : '추가'}
            </button>
         </div>
      </Modal>
   );
}
