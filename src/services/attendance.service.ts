import { apiFetch } from '@/lib/http';

// null이면 정상(관리 대상 아님) - 목록·통계·상세 조회 API가 전부 이 3단계 위험도 문자열을 공유한다
export type AttendanceRiskLevel = 'CAUTION' | 'WARNING' | 'RISK' | null;

export interface AttendancePeriodRate {
   periodNo: number;
   attendanceRate: number;
}

export interface AttendanceSummaryResponse {
   presentDays: number;
   lateCount: number;
   earlyLeaveCount: number;
   outingCount: number;
   absentDays: number;
   leaveDays: number;
   sickDays: number;
   attendanceRate: number;
   riskLevel: AttendanceRiskLevel;
   periodRates: AttendancePeriodRate[];
}

// 훈련생 본인의 출결 데이터 조회
export function getMyAttendanceSummary() {
   return apiFetch<AttendanceSummaryResponse>('/attendance/summary');
}

// 운영진용 개인(훈련생) 출결 데이터 조회
export function getStudentAttendanceSummary(userId: number) {
   return apiFetch<AttendanceSummaryResponse>(`/attendance/summary/${userId}`);
}

// 출결 기록이 없는 날은 status/checkInTime/checkOutTime이 전부 null로 내려옴
export type AttendanceMonthlyDayStatus = 'NORMAL' | 'IRREGULAR' | 'ABSENT';

export interface AttendanceMonthlyDay {
   date: string; // yyyy-MM-dd
   status: AttendanceMonthlyDayStatus | null;
   checkInTime: string | null; // HH:mm:ss
   checkOutTime: string | null;
}

export interface AttendanceMonthlyResponse {
   yearMonth: string; // yyyy-MM
   days: AttendanceMonthlyDay[];
}

// 훈련생 본인의 월간 출석 내역 조회
export function getMyAttendanceMonthly(year: number, month: number) {
   return apiFetch<AttendanceMonthlyResponse>(`/attendance/monthly?year=${year}&month=${month}`);
}

// 운영진용 훈련생(개인) 별 월간 출결 데이터 조회
export function getStudentAttendanceMonthly(userId: number, year: number, month: number) {
   return apiFetch<AttendanceMonthlyResponse>(
      `/attendance/monthly/${userId}?year=${year}&month=${month}`,
   );
}

export interface LeaveSickCountResponse {
   remainingLeaveDays: number;
   remainingSickDays: number;
}

// 훈련생 본인의 잔여 휴가/병결 조회
export function getMyLeaveSickCount() {
   return apiFetch<LeaveSickCountResponse>('/attendance/leave-sick/count');
}

// 운영진용 잔여 휴가/병결 조회
export function getStudentLeaveSickCount(userId: number) {
   return apiFetch<LeaveSickCountResponse>(`/attendance/leave-sick/count/${userId}`);
}

export interface AttendanceListItem {
   name: string;
   attendanceRate: number;
   lateCount: number;
   earlyLeaveCount: number;
   outingCount: number;
   absentDays: number;
   status: AttendanceRiskLevel;
}

// 운영진용 훈련생 전체 출결 목록 조회 - 이름만 내려오고 훈련생 식별자/소속 팀은 포함하지 않음
export function getAttendanceList() {
   return apiFetch<AttendanceListItem[]>('/attendance/list');
}

export interface AttendanceDashboardSummary {
   averageAttendanceRate: number;
   expectedCompletionRate: number;
   totalStudents: number;
   activeStudents: number;
   // 메인 대시보드의 "오늘 출석한 사람 수" - 구글 시트 동기화 데이터가 반영된다. 아직 한 번도
   // 동기화하지 않았으면 null로 내려올 수 있음
   attendedTodayCount: number | null;
   // 아래 인원 통계들도 attendedTodayCount와 같은 이유로(구글 시트 동기화 전) null로 내려올 수 있음
   managedStudents: number | null;
   atRiskStudents: number;
   dropoutStudents: number;
   cautionStudents: number | null;
   warningStudents: number | null;
   riskStudents: number | null;
}

// 운영진용 훈련생 전체 출결 통계
export function getAttendanceDashboardSummary() {
   return apiFetch<AttendanceDashboardSummary>('/attendance/dashboard-summary');
}

export interface PresentAbsentCountPoint {
   date: string; // yyyy-MM-dd
   presentCount: number;
   absentCount: number;
}

// 운영진용 단위기간별 결석/출석 추이 - periodId를 안 주면 오늘이 속한 단위기간으로 조회
export function getPresentAbsentCount(periodId?: number) {
   const query = periodId != null ? `?periodId=${periodId}` : '';
   return apiFetch<PresentAbsentCountPoint[]>(`/attendance/present-absent/count${query}`);
}

export interface AttendanceSheetColumnMapping {
   name: string;
   trainingStatus: string;
   attendanceStatus: string;
   checkIn: string;
   checkOut: string;
   outing: string;
   return: string;
   trainingDate: string;
}

export interface SaveAttendanceSheetLinkPayload {
   sheetUrl: string;
   tabName: string;
   // "시트 이름!I2" 형태로 고정 - 날짜가 항상 이 셀에 있어야 동기화 시 "오늘"을 판단할 수 있음
   dateCellRange: string;
   columnMapping: AttendanceSheetColumnMapping;
}

// 출결 시트 연동 설정 저장 - 응답 본문 없음
export function saveAttendanceSheetLink(body: SaveAttendanceSheetLinkPayload) {
   return apiFetch<void>('/attendance/sheet-link', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface AttendanceSheetLinkResponse {
   attendanceSheetLinkId: number;
   sheetUrl: string;
   tabName: string;
   columnMapping: AttendanceSheetColumnMapping;
   lastSyncedAt: string | null;
}

// 저장된 출결 시트 연동 설정 조회 - 등록된 게 없으면 404(ATTENDANCE_005)
export function getAttendanceSheetLink() {
   return apiFetch<AttendanceSheetLinkResponse>('/attendance/sheet-link');
}

export interface AttendanceSheetSyncFailedRow {
   rowNumber: number;
   reason: string;
}

export interface AttendanceSheetSyncResult {
   totalCount: number;
   successCount: number;
   failedCount: number;
   failedRows: AttendanceSheetSyncFailedRow[];
}

// 출결 시트 동기화 실행 - 변동 사항이 있는 행만 읽어와 반영한다
export function syncAttendanceSheet() {
   return apiFetch<AttendanceSheetSyncResult>('/attendance/sheet-sync', { method: 'POST' });
}

export type AttendanceSheetSyncLogResult = 'SUCCESS' | 'PARTIAL';

export interface AttendanceSheetSyncLogEntry {
   syncLogId: number;
   syncedAt: string;
   executorName: string;
   // 실제로 반영된(변동이 있었던) 행 수 - 읽어오긴 했지만 값이 같아 반영할 필요 없던 행은 세지 않음
   successCount: number;
   failedRows: AttendanceSheetSyncFailedRow[];
   result: AttendanceSheetSyncLogResult;
}

// 출결 시트 동기화 이력 조회(최신순)
export function getAttendanceSheetSyncLogs() {
   return apiFetch<AttendanceSheetSyncLogEntry[]>('/attendance/sheet-sync/logs');
}
