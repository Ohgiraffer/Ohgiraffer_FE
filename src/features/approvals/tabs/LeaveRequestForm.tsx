'use client';

import { DatePicker } from '@/components/ui/date-picker';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SignatureUpload from '../components/SignatureUpload';
import { useLeaveRequestForm } from '../hooks/useLeaveRequestForm';

export default function LeaveRequestForm() {
   const {
      form,
      updateField,
      setHasSignature,
      isFilled,
      dateOrderError,
      isConfirmOpen,
      submit,
      confirmSubmit,
      cancelSubmit,
      remainingLeaveDays,
      hasLeaveDaysError,
      phoneNumber,
      isLoadingProfile,
      hasProfileError,
   } = useLeaveRequestForm();

   const phoneNumberDisplay = hasProfileError
      ? '불러오지 못했습니다'
      : isLoadingProfile
        ? '불러오는 중...'
        : (phoneNumber ?? '-');

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-7">
         <h2 className="text-lg font-bold text-gray-900">휴가 신청</h2>

         <div className="mt-2 rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-3 text-sm text-gray-700">
            잔여 휴가:{' '}
            <span className="font-bold">
               {hasLeaveDaysError
                  ? '불러오지 못했습니다'
                  : remainingLeaveDays === null
                    ? '불러오는 중...'
                    : `${remainingLeaveDays}일`}
            </span>
         </div>

         <div className="mt-4 grid grid-cols-2 gap-6">
            <div>
               <label className="text-[15px] font-semibold text-gray-900">
                  생년월일 <span className="font-bold text-[16px] text-brand-gold">*</span>
               </label>
               <DatePicker
                  value={form.birthDate}
                  onChange={(value) => updateField('birthDate', value)}
                  className="mt-2"
               />
            </div>
            <div>
               <label className="text-[15px] font-semibold text-gray-900">
                  전화번호 <span className="font-bold text-[16px] text-brand-gold">*</span>
               </label>
               <input
                  type="text"
                  readOnly
                  disabled
                  value={phoneNumberDisplay}
                  className="mt-2 w-full cursor-not-allowed rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-2.5 text-sm text-gray-500"
               />
            </div>
         </div>

         <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
               <label className="text-[15px] font-semibold text-gray-900">
                  휴가 시작일 <span className="font-bold text-[16px] text-brand-gold">*</span>
               </label>
               <DatePicker
                  value={form.startDate}
                  onChange={(value) => updateField('startDate', value)}
                  className="mt-2"
               />
            </div>
            <div>
               <label className="text-[15px] font-semibold text-gray-900">
                  휴가 종료일 <span className="font-bold text-[16px] text-brand-gold">*</span>
               </label>
               <DatePicker
                  value={form.endDate}
                  onChange={(value) => updateField('endDate', value)}
                  className="mt-2"
               />
               <p
                  className={`mt-1 text-xs text-brand-red ${dateOrderError ? 'visible' : 'invisible'}`}
               >
                  종료일은 시작일보다 빠를 수 없습니다.
               </p>
            </div>
         </div>

         <SignatureUpload onStatusChange={setHasSignature} />

         <div className="mt-2 flex justify-end border-t border-[#F3F4F6] pt-6">
            <button
               type="button"
               disabled={!isFilled}
               onClick={submit}
               className={`cursor-pointer rounded-xs px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isFilled
                     ? 'bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'bg-[#E5E7EB] text-[#9CA3AF]'
               }`}
            >
               신청하기
            </button>
         </div>

         <ConfirmModal
            open={isConfirmOpen}
            title="휴가 결재 서류를 신청하시겠습니까?"
            description="신청 후 결재 담당자에게 알림이 발송됩니다."
            onConfirm={confirmSubmit}
            onClose={cancelSubmit}
         />
      </div>
   );
}
