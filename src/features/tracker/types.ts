import type { AttendanceMonthlyDayStatus, AttendanceRiskLevel } from '@/services/attendance.service';

// 달력/상세 기록에서 쓰는 출결 상태 - 백엔드가 내려주는 단위가 이 3그룹(정상·지각조퇴외출·결석)뿐이라
// 그 이상으로 세분화하지 않는다. 범례상 초록(정상) / 분홍(지각·조퇴·외출) / 진한 빨강(결석)
export type AttendanceDayStatus = AttendanceMonthlyDayStatus;

export const ATTENDANCE_DAY_STATUS_LABELS: Record<AttendanceDayStatus, string> = {
   NORMAL: '정상',
   IRREGULAR: '지각·조퇴·외출',
   ABSENT: '결석',
};

export type AttendanceColorGroup = 'green' | 'pink' | 'red';

export const ATTENDANCE_DAY_STATUS_COLOR_GROUP: Record<AttendanceDayStatus, AttendanceColorGroup> = {
   NORMAL: 'green',
   IRREGULAR: 'pink',
   ABSENT: 'red',
};

export interface AttendanceDayRecord {
   date: string; // yyyy-MM-dd
   status: AttendanceDayStatus | null;
   checkInTime: string | null; // HH:mm:ss
   checkOutTime: string | null;
}

// 정상 / 주의 / 경고 / 제적위험 - 온보딩의 경고·제적 기준 설정과 같은 4단계 모델
export type TraineeRiskStatus = 'NORMAL' | 'CAUTION' | 'WARNING' | 'EXPULSION_RISK';

export const TRAINEE_RISK_LABELS: Record<TraineeRiskStatus, string> = {
   NORMAL: '정상',
   CAUTION: '주의',
   WARNING: '경고',
   EXPULSION_RISK: '제적위험',
};

export const TRAINEE_RISK_TONES: Record<TraineeRiskStatus, 'success' | 'gold' | 'danger'> = {
   NORMAL: 'success',
   CAUTION: 'gold',
   WARNING: 'danger',
   EXPULSION_RISK: 'danger',
};

// 출결 API들이 공유하는 위험도(null/CAUTION/WARNING/RISK) 문자열을 화면에서 쓰는 4단계로 변환
export function mapRiskLevel(riskLevel: AttendanceRiskLevel): TraineeRiskStatus {
   if (riskLevel === 'RISK') return 'EXPULSION_RISK';
   if (riskLevel === 'CAUTION') return 'CAUTION';
   if (riskLevel === 'WARNING') return 'WARNING';
   return 'NORMAL';
}

// 목표 출석률 - 백엔드가 내려주는 값이 아니라 화면에 고정으로 안내하는 기준선
export const ATTENDANCE_TARGET_RATE = 90;

export const RISK_WARNING_MESSAGES: Record<'CAUTION' | 'WARNING' | 'EXPULSION_RISK', string> = {
   CAUTION: `출석률이 ${ATTENDANCE_TARGET_RATE}% 기준에 근접하고 있습니다. 주의가 필요합니다.`,
   WARNING: '출석률이 기준에 미달해 경고 단계입니다. 개선이 필요합니다.',
   EXPULSION_RISK: '출석률 미달로 제적 위험 단계입니다. 즉시 확인이 필요합니다.',
};

// 훈련생 관리 목록(현황 탭) 한 행 - /attendance/list는 이름만 내려주므로, 훈련생 식별자·소속 팀은
// /user/list(getUserList)에서 이름으로 매칭해 채운다. 매칭에 실패하면 null(행 클릭 비활성화)
export interface TraineeSummary {
   traineeId: number | null;
   name: string;
   teamName: string | null;
   attendanceRate: number;
   lateCount: number;
   earlyLeaveCount: number;
   outingCount: number;
   absentCount: number;
   riskStatus: TraineeRiskStatus;
}

export interface StudentAttendanceOverview {
   todayStatus: AttendanceDayStatus | null;
   checkInTime: string | null;
   remainingVacation: number;
   remainingSickLeave: number;
   attendanceRate: number;
   present: number;
   late: number;
   earlyLeave: number;
   outing: number;
   absent: number;
   vacation: number;
   sickLeave: number;
   riskStatus: TraineeRiskStatus;
   periodRates: Array<{ periodNo: number; attendanceRate: number }>;
}

export interface TraineeApprovalHistoryEntry {
   requestedAt: string;
   type: string;
   period: string;
   approvedAt: string | null;
}

export interface TraineeTeamHistoryEntry {
   teamName: string;
   activePeriod: string;
}

export interface TraineeConsultationEntry {
   consultedAt: string;
   counselorName: string;
   title: string;
   status: '완료' | '예정';
}

export type TraineeSubmissionStatus = '제출완료' | '미제출';

export interface TraineeSubmissionEntry {
   boxName: string;
   status: TraineeSubmissionStatus;
   submittedAt: string | null;
}

// 훈련생 상세 페이지 중 출결 API로 다루지 않는 나머지 탭(결재/팀/상담/제출) - 대응하는 API가 아직
// 없어 디자인 확인용 목데이터를 그대로 쓴다
export interface TraineeStaticDetail {
   approvals: TraineeApprovalHistoryEntry[];
   teams: TraineeTeamHistoryEntry[];
   consultations: TraineeConsultationEntry[];
   submissions: TraineeSubmissionEntry[];
}
