'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createPurchaseApproval } from '@/services/approval.service';
import { getBudgetSummary, type BudgetCategorySummary } from '@/services/budget.service';
import type { PurchaseBudgetRequestFormData } from '../types';

const INITIAL_FORM: PurchaseBudgetRequestFormData = {
   category: '',
   itemName: '',
   purpose: '',
   amount: '',
};

export function usePurchaseBudgetRequestForm() {
   const [form, setForm] = useState<PurchaseBudgetRequestFormData>(INITIAL_FORM);
   // 전자 서명은 계정에 등록된 별도 자산이라(SignatureUpload가 조회/등록/삭제를 직접 처리) 여기서는
   // "등록되어 있는지"만 콜백으로 전달받아 들고 있는다
   const [hasSignature, setHasSignature] = useState(false);

   // "예산 관리" 탭에서 연동해둔 구글 시트의 카테고리 목록 - 부트캠프마다 달라서 고정 목록이 아니라
   // 실제 연동 결과(GET /budgets/summary)에서 그대로 가져온다. 시트가 아직 연동 전이면(400/COMMON_001)
   // 오류로 알리지 않고 빈 목록으로 둔다(연동 자체가 안 됐으니 신청할 카테고리도 아직 없는 정상 상태)
   const [categories, setCategories] = useState<BudgetCategorySummary[]>([]);
   const [isLoadingCategories, setIsLoadingCategories] = useState(true);

   useEffect(() => {
      let isMounted = true;

      getBudgetSummary()
         .then((data) => {
            if (isMounted) setCategories(data.categories);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.status === 400 && err.code === 'COMMON_001') return;
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '예산 카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoadingCategories(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const updateField = <K extends keyof PurchaseBudgetRequestFormData>(
      field: K,
      value: PurchaseBudgetRequestFormData[K],
   ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
   };

   const isFilled = Boolean(
      form.category !== '' &&
      form.itemName.trim() &&
      form.purpose.trim() &&
      form.amount &&
      Number(form.amount) > 0 &&
      hasSignature,
   );

   const [isConfirmOpen, setIsConfirmOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // "신청하기" 클릭 - 검증 통과 시 바로 제출하지 않고 확인 모달을 띄운다
   const submit = () => {
      if (!isFilled) return;
      setIsConfirmOpen(true);
   };

   // 확인 모달의 [확인] - 실제 제출. category는 isFilled 검증을 통과했으면 항상 숫자값이지만,
   // 타입상 ''도 가능해서 한 번 더 방어한다
   const confirmSubmit = async () => {
      if (isSubmitting || form.category === '') return;
      setIsSubmitting(true);

      try {
         await createPurchaseApproval({
            budgetCategoryId: form.category,
            itemName: form.itemName.trim(),
            amount: Number(form.amount),
            reason: form.purpose.trim(),
         });
         toast.success('구매 예산 신청이 완료되었습니다.');
         setIsConfirmOpen(false);
         setForm(INITIAL_FORM);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '구매 예산 신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsSubmitting(false);
      }
   };

   // 확인 모달의 [취소]/닫기 - 아무 것도 제출하지 않고 모달만 닫는다
   const cancelSubmit = () => setIsConfirmOpen(false);

   return {
      form,
      updateField,
      hasSignature,
      setHasSignature,
      categories,
      isLoadingCategories,
      isFilled,
      isConfirmOpen,
      isSubmitting,
      submit,
      confirmSubmit,
      cancelSubmit,
   };
}
