import type { ApprovalStatus } from '@/services/approval.service';

// 결재 목록(이력/처리) 공용 - 상태별 표시 라벨/배지 톤
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
   PENDING: '대기',
   CHECKED: '확인 중',
   APPROVED: '승인',
   REJECTED: '반려',
   COMPLETED: '처리 완료',
};

export const APPROVAL_STATUS_TONES: Record<
   ApprovalStatus,
   'success' | 'danger' | 'neutral' | 'muted' | 'gold'
> = {
   PENDING: 'muted',
   CHECKED: 'gold',
   APPROVED: 'neutral',
   REJECTED: 'danger',
   COMPLETED: 'success',
};

// 훈련생 휴가 신청 폼 데이터
export type LeaveRequestFormData = {
   birthDate: string;
   startDate: string;
   endDate: string;
};

// 강사 구매 예산 신청 폼 데이터
export type PurchaseBudgetRequestFormData = {
   category: number | '';
   itemName: string;
   purpose: string;
   amount: string;
};
