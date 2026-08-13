import { apiFetch, apiFetchBlob } from '@/lib/http';

// REQUESTED: 내가 신청한 결재 목록 / PROCESSING: 강사·매니저가 처리 가능한 목록(훈련생은 403)
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
   // 확인 처리 후 담당자로 배정된 사용자 - PENDING 상태에서는 아직 null
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

// 로그인한 사용자의 결재 목록 조회 - scope로 "내가 신청한 목록"/"내가 처리 가능한 목록"을 구분
export function getApprovals(scope: ApprovalScope) {
   return apiFetch<GetApprovalsResponse>(`/approvals?scope=${scope}`);
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

// 훈련생의 휴가 신청 결재 생성 - 담당자는 신청 시점에 지정하지 않고, 결재 처리 화면에서
// 강사/매니저가 [확인]을 누른 시점에 배정된다(PATCH /approvals/{approvalId}/check)
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

// 강사의 구매 예산 신청 결재 생성 - 문서상 approverId가 필수라고 되어있었지만 실제 백엔드 스펙
// (live OpenAPI: /v3/api-docs의 CreatePurchaseApprovalRequest)엔 그런 필드가 없다. 담당자는
// 휴가 신청과 마찬가지로 신청 시점에 지정하지 않고, 결재 처리 화면에서 매니저가 확인 처리할 때
// 배정되는 것으로 보임. 활성 전자서명이 없으면 404(APPROVAL_004), 예산 카테고리가 없으면
// 404(APPROVAL_006)
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
   // 확인 처리 후 담당자로 배정된 사용자 - PENDING 상태에서는 아직 null
   approverId: number | null;
   approverName: string | null;
   requestedAt: string;
   // 담당자 확인 처리 일시 - PENDING 상태에서는 아직 null
   confirmedAt: string | null;
   // 승인/반려 처리 일시
   processedAt: string | null;
   startDate: string | null;
   endDate: string | null;
   budgetCategoryId: number | null;
   budgetCategoryName: string | null;
   itemName: string | null;
   amount: number | null;
   // 결재 생성 시점의 전자서명 스냅샷 - 신청자가 이후 서명을 바꿔도 이 값은 유지됨
   signatureImage: string | null;
}

// 결재 요청 상세 조회 - 내가 신청한 결재 / 같은 bootcamp의 PENDING 결재 / 내가 담당자로
// 배정된 결재만 조회 가능(그 외엔 403)
export function getApprovalDetail(approvalId: number) {
   return apiFetch<ApprovalDetail>(`/approvals/${approvalId}`);
}

// 확인/승인/반려 처리 응답 - 셋 다 같은 모양(변경된 상태만 알려주고, 상세 정보는 상세 조회로 다시 조회)
export interface ProcessApprovalResponse {
   approvalId: number;
   requestType: ApprovalRequestType;
   status: ApprovalStatus;
   title: string;
   requestedAt: string;
}

// 강사/매니저가 PENDING 결재를 확인 처리 - 처리한 사용자가 담당자로 배정되고 상태가 CHECKED로 바뀐다
export function checkApproval(approvalId: number) {
   return apiFetch<ProcessApprovalResponse>(`/approvals/${approvalId}/check`, {
      method: 'PATCH',
   });
}

// 담당자로 배정된 CHECKED 결재를 승인 처리 - 상태가 APPROVED로 바뀐다
export function approveApproval(approvalId: number) {
   return apiFetch<ProcessApprovalResponse>(`/approvals/${approvalId}/approve`, {
      method: 'PATCH',
   });
}

// 담당자로 배정된 CHECKED 결재를 반려 처리 - 사유 필수, 상태가 REJECTED로 바뀐다
export function rejectApproval(approvalId: number, rejectionReason: string) {
   return apiFetch<ProcessApprovalResponse>(`/approvals/${approvalId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason }),
   });
}

// 휴가 신청서 PDF 다운로드 - 요청 시점에 서버가 즉시 생성해서 내려줌(별도 파일로 저장하지 않음).
// 구매 요청 결재는 다운로드 대상이 아니라 호출 시 400
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
   // 화면 표시용으로 이미 포맷된 기간 문자열 (예: "2026-07-15 ~ 2026-07-15(1일)")
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
