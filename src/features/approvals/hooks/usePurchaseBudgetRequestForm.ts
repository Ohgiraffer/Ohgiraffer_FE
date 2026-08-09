'use client';

import { useState } from 'react';
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

   const updateField = <K extends keyof PurchaseBudgetRequestFormData>(
      field: K,
      value: PurchaseBudgetRequestFormData[K],
   ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
   };

   const isFilled = Boolean(
      form.category &&
      form.itemName.trim() &&
      form.purpose.trim() &&
      form.amount &&
      Number(form.amount) > 0 &&
      hasSignature,
   );

   const [isConfirmOpen, setIsConfirmOpen] = useState(false);

   // "신청하기" 클릭 - 검증 통과 시 바로 제출하지 않고 확인 모달을 띄운다
   const submit = () => {
      if (!isFilled) return;
      setIsConfirmOpen(true);
   };

   // 확인 모달의 [확인] - 실제 제출
   const confirmSubmit = () => {
      setIsConfirmOpen(false);

      // TODO: 백엔드 구매 예산 신청 API(budgetCategoryId 매핑, approverId 제거 반영) 준비되면 연동
      setForm(INITIAL_FORM);
   };

   // 확인 모달의 [취소]/닫기 - 아무 것도 제출하지 않고 모달만 닫는다
   const cancelSubmit = () => setIsConfirmOpen(false);

   return {
      form,
      updateField,
      hasSignature,
      setHasSignature,
      isFilled,
      isConfirmOpen,
      submit,
      confirmSubmit,
      cancelSubmit,
   };
}
