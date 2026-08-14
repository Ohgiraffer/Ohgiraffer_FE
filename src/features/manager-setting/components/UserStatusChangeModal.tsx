'use client';

import { useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import type { ManagerSettingUser } from '../types';

export type UserStatusChangeReason = '자퇴' | '제적';

const REASON_OPTIONS: Array<{ value: UserStatusChangeReason; label: string }> = [
   { value: '자퇴', label: '자퇴' },
   { value: '제적', label: '제적' },
];

type Props = {
   user: ManagerSettingUser | null;
   onClose: () => void;
   onConfirm: (reason: UserStatusChangeReason) => Promise<void>;
};

// 사용자 목록 휴지통 버튼(자퇴/제적 처리)
export default function UserStatusChangeModal({ user, onClose, onConfirm }: Props) {
   const [reason, setReason] = useState<UserStatusChangeReason | ''>('');
   const [isAcknowledged, setIsAcknowledged] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const isSubmittingRef = useRef(false);

   if (!user) return null;

   const canSubmit = reason !== '' && isAcknowledged && !isSubmitting;

   const handleClose = () => {
      if (isSubmittingRef.current) return;
      setReason('');
      setIsAcknowledged(false);
      onClose();
   };

   const handleConfirm = async () => {
      if (!canSubmit || isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
         await onConfirm(reason);
         setReason('');
         setIsAcknowledged(false);
      } catch {
         // 에러 토스트는 상위(onConfirm)에서 이미 띄워줌 - 여기서는 선택값을 유지한 채 다시 시도할 수 있게 둔다
      } finally {
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

   return (
      <Modal
         onClose={handleClose}
         ariaLabel="사용자 상태 변경"
         panelClassName="w-full max-w-md"
         closeOnBackdropClick={false}
      >
         <h2 className="text-xl font-bold text-gray-900">사용자 상태 변경</h2>
         <p className="mt-2 text-sm text-gray-500">
            선택한 사유로 사용자의 상태가 변경되며,
            <br />
            해당 사용자는 로그인 및 서비스 이용이 제한됩니다.
         </p>

         <div className="mt-6">
            <label htmlFor="user-status-reason" className="text-[15px] font-semibold text-gray-900">
               변경 사유 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <Select
               value={reason}
               onValueChange={(value) => value && setReason(value as UserStatusChangeReason)}
               disabled={isSubmitting}
            >
               <SelectTrigger
                  id="user-status-reason"
                  className="mt-2 h-11 w-full rounded-xs bg-white"
               >
                  <SelectValue placeholder="사유를 선택해주세요" />
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  {REASON_OPTIONS.map((option) => (
                     <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                        {option.label}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xs border border-brand-gold/40 bg-brand-cream/40 px-4 py-3 text-sm text-gray-900">
            <input
               type="checkbox"
               checked={isAcknowledged}
               onChange={(event) => setIsAcknowledged(event.target.checked)}
               disabled={isSubmitting}
               className="h-4 w-4 shrink-0 cursor-pointer accent-brand-green disabled:cursor-not-allowed"
            />
            사용자 상태를 변경한 경우, 되돌릴 수 없습니다.
         </label>

         <div className="mt-6 flex gap-2">
            <button
               type="button"
               onClick={handleClose}
               disabled={isSubmitting}
               className="flex-1 cursor-pointer rounded-xs border border-[#E5E7EB] py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
               취소
            </button>
            <button
               type="button"
               disabled={!canSubmit}
               onClick={handleConfirm}
               className={`flex-1 rounded-xs py-2.5 text-sm font-semibold ${
                  canSubmit
                     ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               {isSubmitting ? '변경 중...' : '확인'}
            </button>
         </div>
      </Modal>
   );
}
