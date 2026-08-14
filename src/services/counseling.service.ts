import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';

export interface Counselor {
   counselorId: number;
   name: string;
   role: UserRole;
   profileImgUrl?: string | null;
}

// 훈련생 "상담 신청" - 상담 가능 운영진 목록
export function getCounselors() {
   return apiFetch<Counselor[]>('/consultation/counselors');
}

// 훈련생 "상담 신청" - 선택한 운영진의 상담 가능일 목록
export function getCounselorAvailableDates(counselorId: number, yearMonth: string) {
   const params = new URLSearchParams({ counselorId: String(counselorId), yearMonth });
   return apiFetch<string[]>(`/consultation/available-dates?${params}`);
}

export interface AvailableTimeSlot {
   time: string;
   isReserved: boolean;
}

function normalizeTime(time: string) {
   return time.slice(0, 5);
}

function normalizeAvailableTimeSlots(slots: AvailableTimeSlot[]): AvailableTimeSlot[] {
   return slots.map((slot) => ({ ...slot, time: normalizeTime(slot.time) }));
}

// 훈련생 "상담 신청" - 선택한 운영진 + 날짜의 상담 가능 시간
export function getAvailableTimes(counselorId: number, date: string) {
   const params = new URLSearchParams({ counselorId: String(counselorId), date });
   return apiFetch<AvailableTimeSlot[]>(`/consultation/available-times?${params}`).then(
      normalizeAvailableTimeSlots,
   );
}

export interface CreateConsultationRequest {
   counselorId: number;
   scheduledAt: string;
   topic: string;
   content: string;
}

export interface CreateConsultationResponse {
   consultationId: number;
}

// 훈련생 "상담 신청" 제출
export function createConsultation(body: CreateConsultationRequest) {
   return apiFetch<CreateConsultationResponse>('/consultation', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export type ConsultationStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface MyConsultationSummary {
   consultationId: number;
   topic: string;
   scheduledAt: string;
   counselorName: string;
   status: ConsultationStatus;
}

// 훈련생 "내 상담 이력"
export function getMyConsultations() {
   return apiFetch<MyConsultationSummary[]>('/consultation/my');
}

export interface ConsultationDetail {
   consultationId: number;
   topic: string;
   requesterName: string;
   counselorName: string;
   scheduledAt: string;
   content: string;
   counselorNote: string | null;
   aiBrief: string | null;
   status: ConsultationStatus;
}

// 상담 1건 상세
export function getConsultationDetail(consultationId: number) {
   return apiFetch<ConsultationDetail>(`/consultation/${consultationId}`);
}

export interface SaveCounselorNoteRequest {
   counselorNote: string;
}

export interface SaveCounselorNoteResponse {
   aiBriefGenerated: boolean;
   message: string;
}

// 담당 운영진 본인 - 상담 기록 저장/수정(저장하면 상담 상태가 COMPLETED로 바뀜)
export function saveCounselorNote(consultationId: number, body: SaveCounselorNoteRequest) {
   return apiFetch<SaveCounselorNoteResponse>(`/consultation/${consultationId}/record`, {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

// 강사·매니저 본인 - 상담 가능 시간을 등록해둔 날짜 목록
export function getMyAvailableDates(yearMonth: string) {
   const params = new URLSearchParams({ yearMonth });
   return apiFetch<string[]>(`/consultation/available-dates/mine?${params}`);
}

// 강사·매니저 본인 - 특정 날짜(date: 'yyyy-MM-dd')에 등록해둔 상담 가능 시간 + 예약 여부
export function getMyAvailableTimes(date: string) {
   const params = new URLSearchParams({ date });
   return apiFetch<AvailableTimeSlot[]>(`/consultation/available-times/mine?${params}`).then(
      normalizeAvailableTimeSlots,
   );
}

export interface SaveMyAvailableTimesRequest {
   date: string;
   times: string[];
}

// 강사·매니저 본인 - 특정 날짜의 상담 가능 시간 교체 저장
export function saveMyAvailableTimes(body: SaveMyAvailableTimesRequest) {
   return apiFetch<void>('/consultation/available-times', {
      method: 'PUT',
      body: JSON.stringify(body),
   });
}

export interface StaffConsultationSummary {
   consultationId: number;
   topic: string;
   scheduledAt: string;
   requesterName: string;
   counselorName: string;
   status: ConsultationStatus;
}

// 강사·매니저 본인 - 자신에게 담당으로 잡힌 상담 중 다가오는 상담
export function getUpcomingConsultations() {
   return apiFetch<StaffConsultationSummary[]>('/consultation/upcoming');
}

// 강사·매니저 - 전체 운영진의 상담 이력(예정+완료+취소)
export function getConsultationHistory() {
   return apiFetch<StaffConsultationSummary[]>('/consultation/history');
}
