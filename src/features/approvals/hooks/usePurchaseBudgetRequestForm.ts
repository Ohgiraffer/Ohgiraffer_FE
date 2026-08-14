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
   const [hasSignature, setHasSignature] = useState(false);

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

   // "신청하기" 클릭 - 검증 통과 시 바로 제출하지 않고 확인 모달
   const submit = () => {
      if (!isFilled) return;
      setIsConfirmOpen(true);
   };

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
