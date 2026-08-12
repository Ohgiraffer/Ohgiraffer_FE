// 출결 상세 기록 한 건의 상태 - 범례상 초록(출석·휴가·병결) / 분홍(지각·조퇴·외출) / 진한 빨강(결석) 3그룹으로 묶인다
export type AttendanceStatus =
   | 'PRESENT'
   | 'LATE'
   | 'EARLY_LEAVE'
   | 'OUTING'
   | 'ABSENT'
   | 'VACATION'
   | 'SICK_LEAVE';

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
   PRESENT: '출석',
   LATE: '지각',
   EARLY_LEAVE: '조퇴',
   OUTING: '외출',
   ABSENT: '결석',
   VACATION: '휴가',
   SICK_LEAVE: '병결',
};

export type AttendanceColorGroup = 'green' | 'pink' | 'red';

export const ATTENDANCE_STATUS_COLOR_GROUP: Record<AttendanceStatus, AttendanceColorGroup> = {
   PRESENT: 'green',
   VACATION: 'green',
   SICK_LEAVE: 'green',
   LATE: 'pink',
   EARLY_LEAVE: 'pink',
   OUTING: 'pink',
   ABSENT: 'red',
};

export interface AttendanceDayRecord {
   date: string; // yyyy-MM-dd
   status: AttendanceStatus;
   checkIn?: string; // 'HH:mm'
   checkOut?: string; // 'HH:mm'
   note?: string;
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

export interface TraineeSummary {
   traineeId: number;
   name: string;
   className: string;
   attendanceRate: number;
   lateCount: number;
   earlyLeaveCount: number;
   outingCount: number;
   absentCount: number;
   riskStatus: TraineeRiskStatus;
}

export interface TrainingOverviewStats {
   averageAttendanceRate: number;
   expectedCompletionRate: number;
   totalTrainees: number;
   activeTrainees: number;
   managedTrainees: number;
   atRiskTrainees: number;
   dropoutTrainees: number;
}

export interface AttendanceTrendPoint {
   date: string; // MM/dd
   present: number;
   absent: number;
}

export interface StudentAttendanceOverview {
   todayStatus: AttendanceStatus;
   checkInTime: string | null;
   remainingVacation: number;
   remainingSickLeave: number;
   attendanceRate: number;
   targetRate: number;
   present: number;
   late: number;
   earlyLeave: number;
   outing: number;
   absent: number;
   vacation: number;
   sickLeave: number;
   warningMessage: string | null;
   records: AttendanceDayRecord[];
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

export interface TraineeDetail {
   traineeId: number;
   name: string;
   className: string;
   attendanceRate: number;
   remainingVacation: number;
   remainingSickLeave: number;
   present: number;
   late: number;
   earlyLeave: number;
   outing: number;
   absent: number;
   vacation: number;
   sickLeave: number;
   records: AttendanceDayRecord[];
   approvals: TraineeApprovalHistoryEntry[];
   teams: TraineeTeamHistoryEntry[];
   consultations: TraineeConsultationEntry[];
   submissions: TraineeSubmissionEntry[];
}
