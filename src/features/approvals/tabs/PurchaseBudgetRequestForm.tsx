'use client';

import { format } from 'date-fns';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuth } from '@/components/auth/AuthContext';
import SignatureUpload from '../components/SignatureUpload';
import { usePurchaseBudgetRequestForm } from '../hooks/usePurchaseBudgetRequestForm';

export default function PurchaseBudgetRequestForm() {
   const { me } = useAuth();
   const {
      form,
      updateField,
      setHasSignature,
      categories,
      isLoadingCategories,
      isFilled,
      isConfirmOpen,
      isSubmitting,
      submit,
      confirmSubmit,
      cancelSubmit,
   } = usePurchaseBudgetRequestForm();

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-8">
         <h2 className="text-lg font-bold text-gray-900">구매 예산 신청</h2>

         <div className="mt-6">
            <label className="text-[15px] font-semibold text-gray-900">
               카테고리 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <Select
               value={form.category === '' ? '' : String(form.category)}
               onValueChange={(value) => value && updateField('category', Number(value))}
               disabled={isLoadingCategories}
            >
               <SelectTrigger className="data-[size=default]:h-10 mt-2 w-full rounded-xs bg-white">
                  <SelectValue placeholder="카테고리를 선택해주세요">
                     {(value: string | null) => {
                        if (value) {
                           return (
                              categories.find((c) => String(c.categoryId) === value)
                                 ?.categoryName ?? null
                           );
                        }
                        if (isLoadingCategories) return '불러오는 중...';
                        if (categories.length === 0) return '연동된 예산 카테고리가 없습니다';
                        return '카테고리를 선택해주세요';
                     }}
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  {categories.map((category) => (
                     <SelectItem
                        key={category.categoryId}
                        value={String(category.categoryId)}
                        className="cursor-pointer"
                     >
                        {category.categoryName}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
               <label className="text-[15px] font-semibold text-gray-900">신청 날짜</label>
               <input
                  type="text"
                  value={format(new Date(), 'yyyy-MM-dd')}
                  disabled
                  className="mt-2 w-full rounded-xs border border-[#E5E7EB] bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
               />
            </div>
            <div>
               <label className="text-[15px] font-semibold text-gray-900">요청자</label>
               <input
                  type="text"
                  value={me?.name ?? ''}
                  disabled
                  className="mt-2 w-full rounded-xs border border-[#E5E7EB] bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
               />
            </div>
         </div>

         <div className="mt-6">
            <label className="text-[15px] font-semibold text-gray-900">
               품목명 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <input
               type="text"
               value={form.itemName}
               onChange={(event) => updateField('itemName', event.target.value)}
               placeholder="구매할 품목명을 입력해주세요"
               className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>

         <div className="mt-6">
            <label className="text-[15px] font-semibold text-gray-900">
               사용 목적 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <textarea
               value={form.purpose}
               onChange={(event) => updateField('purpose', event.target.value)}
               placeholder="구매 목적을 상세히 입력해주세요"
               rows={4}
               className="mt-2 w-full resize-none rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>

         <div className="mt-6">
            <label className="text-[15px] font-semibold text-gray-900">
               요청 금액 (원) <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <input
               type="number"
               min={0}
               value={form.amount}
               onChange={(event) => updateField('amount', event.target.value)}
               placeholder="0"
               className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>

         <div className="mt-6">
            <SignatureUpload onStatusChange={setHasSignature} />
         </div>

         <div className="mt-6 flex justify-end border-t border-[#F3F4F6] pt-6">
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
            title="구매 예산 결재 서류를 신청하시겠습니까?"
            description="신청 후 결재 담당자에게 알림이 발송됩니다."
            confirmLabel={isSubmitting ? '처리 중...' : '확인'}
            busy={isSubmitting}
            onConfirm={confirmSubmit}
            onClose={cancelSubmit}
         />
      </div>
   );
}
