'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createPurchaseApproval } from '@/services/approval.service';
import { getBudgetSummary } from '@/services/budget.service';
import type { PurchaseBudgetRequestFormData } from '../types';

const INITIAL_FORM: PurchaseBudgetRequestFormData = {
   category: '',
   itemName: '',
   purpose: '',
   amount: '',
};

export function usePurchaseBudgetRequestForm() {
   const [form, setForm] = useState<PurchaseBudgetRequestFormData>(INITIAL_FORM);
   const [hasSignature, setHasSignature] = useState(false);

   // useBudgetManagement가 시트 동기화 후 최신 값을 이 캐시에 채워 넣어준다. 예산은 결재
   // 승인에 따라 바뀌니 기본 5분보다 짧게 둔다
   const {
      data: budgetSummary,
      isLoading: isLoadingCategories,
      error: categoriesError,
   } = useQuery({
      queryKey: ['budgetSummary'],
      queryFn: getBudgetSummary,
      staleTime: 60 * 1000,
   });
   const categories = budgetSummary?.categories ?? [];

   useEffect(() => {
      if (!categoriesError) return;
      if (
         categoriesError instanceof ApiError &&
         categoriesError.status === 400 &&
         categoriesError.code === 'COMMON_001'
      ) {
         return;
      }
      toast.error(
         categoriesError instanceof ApiError
            ? categoriesError.message
            : '예산 카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
   }, [categoriesError]);

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
   const isSubmittingRef = useRef(false);

   // "신청하기" 클릭 - 검증 통과 시 바로 제출하지 않고 확인 모달
   const submit = () => {
      if (!isFilled) return;
      setIsConfirmOpen(true);
   };

   const confirmSubmit = async () => {
      if (isSubmittingRef.current || form.category === '') return;
      isSubmittingRef.current = true;
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
         isSubmittingRef.current = false;
         setIsSubmitting(false);
      }
   };

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
