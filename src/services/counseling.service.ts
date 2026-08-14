import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';

export interface Counselor {
   counselorId: number;
   name: string;
   // 강사·매니저만 내려옴(상담 가능 시간을 등록해둔 사람만)
   role: UserRole;
   // 백엔드 응답에 아직 없음(추가 요청해둔 상태) - 내려오면 그대로 쓰도록 미리 선택 필드로 받아둔다
   profileImgUrl?: string | null;
}

// 훈련생 "상담 신청" - 상담 가능(가능 시간을 등록해둔) 운영진 목록
export function getCounselors() {
   return apiFetch<Counselor[]>('/consultation/counselors');
}

// 훈련생 "상담 신청" - 선택한 운영진의 특정 월(yearMonth: 'yyyy-MM') 상담 가능일 목록
export function getCounselorAvailableDates(counselorId: number, yearMonth: string) {
   const params = new URLSearchParams({ counselorId: String(counselorId), yearMonth });
   return apiFetch<string[]>(`/consultation/available-dates?${params}`);
}

export interface AvailableTimeSlot {
   time: string;
   // 다른 훈련생이 이미 신청해서 예약된 시간인지 - true면 선택 불가
   isReserved: boolean;
}

// 백엔드가 LocalTime을 문서상 형식(HH:mm)이 아니라 초까지 포함해(HH:mm:ss) 내려줄 때가 있어,
// 시간 문자열을 키로 비교/매칭하는 다른 로직이 깨지지 않도록 응답을 받는 시점에 항상 앞 5자(HH:mm)로 맞춘다
function normalizeTime(time: string) {
   return time.slice(0, 5);
}

function normalizeAvailableTimeSlots(slots: AvailableTimeSlot[]): AvailableTimeSlot[] {
   return slots.map((slot) => ({ ...slot, time: normalizeTime(slot.time) }));
}

// 훈련생 "상담 신청" - 선택한 운영진 + 날짜(date: 'yyyy-MM-dd')의 상담 가능 시간
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

// 훈련생 "상담 신청" 제출. 이미 예약된 시간이면 409(CONSULTATION_002),
// 등록되지 않은(운영진이 이후에 닫은) 시간이면 400(CONSULTATION_005)
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

// 훈련생 "내 상담 이력" - scheduledAt 내림차순으로 이미 정렬되어 옴
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
   // 상담 전이면 null, 상담 후면 문자열. 훈련생이 조회하면 항상 null(비공개)로 내려옴
   counselorNote: string | null;
   // 상담 전이면 null, 요약 생성 실패해도 null. 훈련생에게는 애초에 노출되지 않음
   aiBrief: string | null;
   status: ConsultationStatus;
}

// 상담 1건 상세 - 본인이 신청했거나(훈련생) 담당인(운영진) 상담이 아니면 403(CONSULTATION_008)
export function getConsultationDetail(consultationId: number) {
   return apiFetch<ConsultationDetail>(`/consultation/${consultationId}`);
}

export interface SaveCounselorNoteRequest {
   counselorNote: string;
}

export interface SaveCounselorNoteResponse {
   // AI 요약 생성 성공 여부 - 실패(500ms 간격 3회 재시도 후에도 실패)해도 메모 자체는 저장됨
   aiBriefGenerated: boolean;
   message: string;
}

// 담당 운영진 본인 - 상담 기록 저장/수정(저장하면 상담 상태가 COMPLETED로 바뀜).
// 응답엔 저장된 메모/요약 내용이 없이 성공 여부만 오므로, 최신 내용은 상세를 다시 조회해서 가져와야 한다.
// 403(CONSULTATION_008, 본인 담당 상담 아님) · 409(CONSULTATION_003, 취소·종료된 상담) ·
// 400(CONSULTATION_006, 작성 기한(상담일+1일) 지남) · 404(CONSULTATION_001, 없는 상담)
export function saveCounselorNote(consultationId: number, body: SaveCounselorNoteRequest) {
   return apiFetch<SaveCounselorNoteResponse>(`/consultation/${consultationId}/record`, {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

// 강사·매니저 본인 - 특정 월(yearMonth: 'yyyy-MM')에 상담 가능 시간을 등록해둔 날짜 목록
export function getMyAvailableDates(yearMonth: string) {
   const params = new URLSearchParams({ yearMonth });
   return apiFetch<string[]>(`/consultation/available-dates/mine?${params}`);
}

// 강사·매니저 본인 - 특정 날짜(date: 'yyyy-MM-dd')에 등록해둔 상담 가능 시간 + 예약 여부.
// 한때는 시간 문자열만 내려주는 걸로 알고 있었지만, 실제 라이브 스펙(GET /consultation/available-times/mine,
// operationId getRegisteredTimes)을 확인해보니 훈련생용 /consultation/available-times와 동일하게
// { time, isReserved } 객체 배열을 내려준다 - string[]로 잘못 가정해 map(normalizeTime)이 문자열이
// 아닌 값에 .slice를 호출하며 터져서, 시간이 하나라도 등록된 날짜를 고르면 조회가 실패하던 버그가 있었음
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

// 강사·매니저 본인 - 특정 날짜의 상담 가능 시간을 통째로 교체 저장(PUT, 응답 본문 없음).
// 이미 예약이 잡힌 시간을 빼고 보내면 409(CONSULTATION_004)로 거절됨
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

// 강사·매니저 본인 - 자신에게 담당으로 잡힌 상담 중 "다가오는"(미래이면서 취소·완료가 아닌) 상담
export function getUpcomingConsultations() {
   return apiFetch<StaffConsultationSummary[]>('/consultation/upcoming');
}

// 강사·매니저 - 전체 운영진의 상담 이력(예정+완료+취소). 응답 정렬 순서가 화면에서 원하는
// 순서(날짜 오름차순)와 달라서 프론트에서 다시 정렬해서 쓴다
export function getConsultationHistory() {
   return apiFetch<StaffConsultationSummary[]>('/consultation/history');
}
