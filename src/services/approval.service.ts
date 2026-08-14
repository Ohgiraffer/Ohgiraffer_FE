import { apiFetch, apiFetchBlob } from '@/lib/http';

// REQUESTED: 내가 신청한 결재 목록 / PROCESSING: 매니저가 처리 가능한 목록
export type ApprovalScope = 'REQUESTED' | 'PROCESSING';

export type ApprovalRequestType = 'LEAVE' | 'PURCHASE';

export type ApprovalStatus = 'PENDING' | 'CHECKED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface ApprovalSummary {
   approvalId: number;
   requestType: ApprovalRequestType;
   status: ApprovalStatus;
   title: string;
   requesterId: number;
   requesterName: string;
   approverId: number | null;
   approverName: string | null;
   budgetCategoryName: string | null;
   amount: number | null;
   startDate: string | null;
   endDate: string | null;
   requestedAt: string;
}

interface GetApprovalsResponse {
   approvals: ApprovalSummary[];
}

// 로그인한 사용자의 결재 목록 조회
export function getApprovals(scope: ApprovalScope) {
   return apiFetch<GetApprovalsResponse>(`/approvals?scope=${scope}`);
}

export interface ApprovalProfile {
   birthDate: string | null;
   phoneNumber: string | null;
}

// 훈련생 휴가 신청서 작성에 필요한 결재 프로필(생년월일/전화번호) 조회
export function getApprovalProfile() {
   return apiFetch<ApprovalProfile>('/users/me/approval-profile');
}

export interface UpdateApprovalProfileRequest {
   birthDate: string;
}

// 훈련생의 생년월일 저장/수정
export function updateApprovalProfile(body: UpdateApprovalProfileRequest) {
   return apiFetch<ApprovalProfile>('/users/me/approval-profile', {
      method: 'PUT',
      body: JSON.stringify(body),
   });
}

export interface CreateLeaveApprovalRequest {
   startDate: string;
   endDate: string;
}

export interface CreateLeaveApprovalResponse {
   approvalId: number;
   requesterId: number;
   requestType: 'LEAVE';
   status: 'PENDING';
   title: string;
   requestedAt: string;
}

// 훈련생의 휴가 신청 결재 생성
export function createLeaveApproval(body: CreateLeaveApprovalRequest) {
   return apiFetch<CreateLeaveApprovalResponse>('/approvals/leave', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface CreatePurchaseApprovalRequest {
   budgetCategoryId: number;
   itemName: string;
   amount: number;
   reason: string;
}

export interface CreatePurchaseApprovalResponse {
   approvalId: number;
   requestType: 'PURCHASE';
   status: 'PENDING';
   title: string;
   requestedAt: string;
}

// 강사의 구매 예산 신청 결재 생성
export function createPurchaseApproval(body: CreatePurchaseApprovalRequest) {
   return apiFetch<CreatePurchaseApprovalResponse>('/approvals/purchases', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface ApprovalDetail {
   approvalId: number;
   requestType: ApprovalRequestType;
   status: ApprovalStatus;
   title: string;
   reason: string | null;
   rejectionReason: string | null;
   requesterId: number;
   requesterName: string;
   approverId: number | null;
   approverName: string | null;
   requestedAt: string;
   confirmedAt: string | null;
   processedAt: string | null;
   startDate: string | null;
   endDate: string | null;
   budgetCategoryId: number | null;
   budgetCategoryName: string | null;
   itemName: string | null;
   amount: number | null;
   signatureImage: string | null;
}

// 결재 요청 상세 조회
export function getApprovalDetail(approvalId: number) {
   return apiFetch<ApprovalDetail>(`/approvals/${approvalId}`);
}

// 확인/승인/반려 처리 응답
export interface ProcessApprovalResponse {
   approvalId: number;
   requestType: ApprovalRequestType;
   status: ApprovalStatus;
   title: string;
   requestedAt: string;
}

// 강사/매니저가 PENDING 결재를 확인 처리 - 처리한 사용자가 담당자로 배정, 상태 CHECKED로 바뀜
export function checkApproval(approvalId: number) {
   return apiFetch<ProcessApprovalResponse>(`/approvals/${approvalId}/check`, {
      method: 'PATCH',
   });
}

// 담당자로 배정된 CHECKED 결재 승인 처리 - 상태 APPROVED로 바뀜
export function approveApproval(approvalId: number) {
   return apiFetch<ProcessApprovalResponse>(`/approvals/${approvalId}/approve`, {
      method: 'PATCH',
   });
}

// 담당자로 배정된 CHECKED 결재 반려 처리 - 사유 필수, 상태 REJECTED로 바뀜
export function rejectApproval(approvalId: number, rejectionReason: string) {
   return apiFetch<ProcessApprovalResponse>(`/approvals/${approvalId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason }),
   });
}

// 휴가 신청서 PDF 다운로드
export function downloadApprovalPdf(approvalId: number) {
   return apiFetchBlob(`/approvals/${approvalId}/pdf`);
}

export type TraineeApprovalStatus = 'APPROVED' | 'COMPLETED';

export interface TraineeApprovalHistoryEntry {
   approvalId: number;
   requestedDate: string;
   typeName: string;
   startDate: string;
   endDate: string;
   leaveDays: number;
   period: string;
   approvedDate: string | null;
   status: TraineeApprovalStatus;
}

// 운영진용 - 훈련생 관리 상세 페이지의 결재 탭. 현재는 승인 완료된 휴가 결재만 조회된다
export function getTraineeApprovals(traineeId: number) {
   return apiFetch<{ approvals: TraineeApprovalHistoryEntry[] }>(
      `/trainees/${traineeId}/approvals`,
   ).then((res) => res.approvals);
}
