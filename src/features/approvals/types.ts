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
   PENDING: 'gold',
   CHECKED: 'gold',
   APPROVED: 'neutral',
   REJECTED: 'danger',
   COMPLETED: 'success',
};

// 훈련생 "결재 신청" 탭 - 휴가 신청 폼 데이터
// 전자 서명은 서류에 딸린 값이 아니라 계정에 등록해두는 별도 자산이라(조회/등록/삭제 API 별도)
// 여기서는 파일 자체가 아니라 "서명이 등록되어 있는지"만 훅에서 별도로 관리한다
export type LeaveRequestFormData = {
   startDate: string;
   endDate: string;
};

// 강사 "결재 신청" 탭 - 구매 예산 신청 폼 데이터
// TODO: 카테고리는 부트캠프마다 연동된 구글 시트의 "카테고리" 컬럼값을 동기화한 budget_category
// 테이블 기준이라 고정 목록이 아님 - GET /budgets/summary 응답의 카테고리 목록으로 교체 예정
// (그 전까지 임시로 하드코딩). "예비비"가 기타 역할을 겸해서 별도 "기타" 항목/직접입력 필드는 없앰
export const PURCHASE_BUDGET_CATEGORIES = [
   '장비',
   '시설관리',
   'AWS·소프트웨어',
   '교재',
   '예비비',
] as const;

export type PurchaseBudgetCategory = (typeof PURCHASE_BUDGET_CATEGORIES)[number];

export type PurchaseBudgetRequestFormData = {
   category: PurchaseBudgetCategory | '';
   itemName: string;
   purpose: string;
   amount: string;
};
