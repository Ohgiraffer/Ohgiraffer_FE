'use client';

import { useEffect, useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import { getBootcampSettings } from '@/services/bootcampSettings.service';
import { createTeamPeriod, updateTeamPeriod } from '@/services/team.service';
import type { TeamPeriod } from '../types';

// DatePicker는 마스크 입력이 끝나기 전(예: "2025-06-0")에도 onChange를 호출하므로,
// 열 자리가 다 채워진 유효한 날짜인지 별도로 확인해야 한다. date-fns의 parse는
// "2026-02-30"처럼 실존하지 않는 날짜를 다음 달로 보정해버릴 수 있어서, isValid만으로는
// 못 거른다 - 파싱한 날짜를 다시 포맷해 원래 입력과 같은지까지 확인해야 진짜로 유효하다
function isCompleteDate(value: string) {
   if (value.length !== 10) return false;
   const parsed = parse(value, 'yyyy-MM-dd', new Date());
   return isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value;
}

// 두 날짜 범위(양끝 포함)가 겹치는지 - 문자열이 yyyy-MM-dd라 사전순 비교가 곧 날짜순 비교
function isOverlapping(aStart: string, aEnd: string, bStart: string, bEnd: string) {
   return aStart <= bEnd && bStart <= aEnd;
}

interface TeamPeriodAddModalProps {
   // 겹침 검사 대상 - 지금 보드에 이미 떠 있는 기간 목록
   existingPeriods: TeamPeriod[];
   // 있으면 수정 모드 - 겹침 검사에서 자기 자신은 제외하고, PATCH로 저장한다
   editTarget?: TeamPeriod;
   onClose: () => void;
   onSaved: (period: TeamPeriod) => void;
}

export default function TeamPeriodAddModal({
   existingPeriods,
   editTarget,
   onClose,
   onSaved,
}: TeamPeriodAddModalProps) {
   const isEditing = !!editTarget;
   const [startDate, setStartDate] = useState(editTarget?.startDate ?? '');
   const [endDate, setEndDate] = useState(editTarget?.endDate ?? '');
   const [isSubmitting, setIsSubmitting] = useState(false);
   // 부트캠프 전체 기간 - 조회 권한이 없거나(강사 등) 실패하면 그냥 이 검증만 건너뛴다(치명적이지 않은 보조 검증)
   const [bootcampRange, setBootcampRange] = useState<{ startDate: string; endDate: string } | null>(
      null,
   );

   useEffect(() => {
      let isMounted = true;
      getBootcampSettings()
         .then((data) => {
            if (isMounted) setBootcampRange({ startDate: data.startDate, endDate: data.endDate });
         })
         .catch(() => {
            // 부트캠프 기간 조회 실패는 조용히 무시 - 이 검증만 못 하고 나머지는 그대로 진행
         });
      return () => {
         isMounted = false;
      };
   }, []);

   const isStartDateComplete = isCompleteDate(startDate);
   const isEndDateComplete = isCompleteDate(endDate);
   const isDateRangeInvalid = isStartDateComplete && isEndDateComplete && endDate < startDate;

   const isOutsideBootcampRange =
      isStartDateComplete &&
      isEndDateComplete &&
      !isDateRangeInvalid &&
      bootcampRange !== null &&
      (startDate < bootcampRange.startDate || endDate > bootcampRange.endDate);

   const overlappingPeriod =
      isStartDateComplete && isEndDateComplete && !isDateRangeInvalid
         ? existingPeriods
              .filter((p) => p.teamPeriodId !== editTarget?.teamPeriodId)
              .find((p) => isOverlapping(startDate, endDate, p.startDate, p.endDate))
         : undefined;

   const canSubmit =
      isStartDateComplete &&
      isEndDateComplete &&
      !isDateRangeInvalid &&
      !isOutsideBootcampRange &&
      !overlappingPeriod &&
      !isSubmitting;

   const handleSubmit = async () => {
      if (!canSubmit) return;
      setIsSubmitting(true);
      try {
         const period = isEditing
            ? await updateTeamPeriod(editTarget.teamPeriodId, { startDate, endDate })
            : await createTeamPeriod({ startDate, endDate });
         toast.success(isEditing ? '기간을 수정했습니다.' : '기간을 추가했습니다.');
         onSaved(period);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : `기간 ${isEditing ? '수정' : '추가'} 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`,
         );
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Modal
         onClose={onClose}
         ariaLabel={isEditing ? '기간 수정' : '기간 추가'}
         panelClassName="w-full max-w-md"
         closeOnBackdropClick={false}
      >
         <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">{isEditing ? '기간 수정' : '기간 추가'}</h2>
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
               시작일 <span className="font-bold text-brand-gold">*</span>
            </label>
            <div className="mt-2">
               <DatePicker value={startDate} onChange={setStartDate} placeholder="시작 일자" />
            </div>
         </div>

         <div className="mt-4">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900">
               종료일 <span className="font-bold text-brand-gold">*</span>
            </label>
            <div className="mt-2">
               <DatePicker value={endDate} onChange={setEndDate} placeholder="종료 일자" />
               {isDateRangeInvalid && (
                  <p className="mt-1 text-xs text-brand-red">종료일은 시작일보다 빠를 수 없습니다</p>
               )}
               {!isDateRangeInvalid && isOutsideBootcampRange && (
                  <p className="mt-1 text-xs text-brand-red">
                     부트캠프 운영 기간({bootcampRange!.startDate} ~ {bootcampRange!.endDate}) 안이어야 합니다
                  </p>
               )}
               {!isDateRangeInvalid && !isOutsideBootcampRange && overlappingPeriod && (
                  <p className="mt-1 text-xs text-brand-red">
                     {overlappingPeriod.startDate} ~ {overlappingPeriod.endDate} 기간과 겹칩니다
                  </p>
               )}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">
               시작일과 종료일은 부트캠프 운영 기간 내여야 하며, 종료일은 시작일보다 빠를 수 없습니다.
            </p>
         </div>

         <div className="mt-6 flex justify-end gap-2">
            <button
               type="button"
               onClick={handleSubmit}
               disabled={!canSubmit}
               className="cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               {isSubmitting ? `${isEditing ? '수정' : '추가'} 중...` : isEditing ? '수정' : '추가'}
            </button>
         </div>
      </Modal>
   );
}
