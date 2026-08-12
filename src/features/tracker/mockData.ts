// 하드코딩된 더미 데이터 — 디자인 확인용, 추후 API 연동 예정
import type {
   AttendanceDayRecord,
   AttendanceTrendPoint,
   StudentAttendanceOverview,
   TraineeDetail,
   TraineeSummary,
   TrainingOverviewStats,
} from './types';

function buildRecords(entries: Array<[string, AttendanceDayRecord['status'], string?, string?, string?]>) {
   return entries.map(
      ([date, status, checkIn, checkOut, note]): AttendanceDayRecord => ({
         date,
         status,
         checkIn,
         checkOut,
         note,
      }),
   );
}

export const MOCK_STUDENT_OVERVIEW: StudentAttendanceOverview = {
   todayStatus: 'PRESENT',
   checkInTime: '09:02',
   remainingVacation: 3,
   remainingSickLeave: 2,
   attendanceRate: 87,
   targetRate: 90,
   present: 87,
   late: 5,
   earlyLeave: 3,
   outing: 7,
   absent: 5,
   vacation: 1,
   sickLeave: 1,
   warningMessage: '출석률이 90% 기준에 근접하고 있습니다. 주의가 필요합니다.',
   records: buildRecords([
      ['2025-07-05', 'LATE'],
      ['2025-07-07', 'PRESENT'],
      ['2025-07-08', 'PRESENT'],
      ['2025-07-09', 'OUTING'],
      ['2025-07-10', 'ABSENT'],
      ['2025-07-11', 'PRESENT'],
      ['2025-07-13', 'PRESENT'],
      ['2025-07-14', 'PRESENT'],
      ['2025-07-15', 'LATE'],
      ['2025-07-16', 'PRESENT'],
      ['2025-07-17', 'PRESENT'],
      ['2025-07-18', 'PRESENT'],
      ['2025-07-20', 'LATE'],
      ['2025-07-21', 'PRESENT'],
      ['2025-07-24', 'PRESENT'],
      ['2025-07-25', 'ABSENT'],
      ['2025-07-27', 'PRESENT'],
      ['2025-07-28', 'PRESENT'],
      ['2025-07-30', 'PRESENT'],
   ]),
};

export const MOCK_TRAINING_OVERVIEW_STATS: TrainingOverviewStats = {
   averageAttendanceRate: 88.2,
   expectedCompletionRate: 76.0,
   totalTrainees: 23,
   activeTrainees: 22,
   managedTrainees: 17,
   atRiskTrainees: 4,
   dropoutTrainees: 1,
};

export const MOCK_ATTENDANCE_TREND: AttendanceTrendPoint[] = [
   { date: '07/01', present: 23, absent: 1 },
   { date: '07/03', present: 22, absent: 2 },
   { date: '07/07', present: 24, absent: 0 },
   { date: '07/10', present: 21, absent: 2 },
   { date: '07/14', present: 20, absent: 3 },
   { date: '07/17', present: 23, absent: 1 },
   { date: '07/21', present: 22, absent: 1 },
   { date: '07/24', present: 19, absent: 3 },
   { date: '07/28', present: 22, absent: 2 },
   { date: '07/31', present: 23, absent: 1 },
];

export const MOCK_TRAINEES: TraineeSummary[] = [
   {
      traineeId: 1,
      name: '김철수',
      className: '2반',
      attendanceRate: 95,
      lateCount: 1,
      earlyLeaveCount: 0,
      outingCount: 2,
      absentCount: 0,
      riskStatus: 'NORMAL',
   },
   {
      traineeId: 2,
      name: '이영희',
      className: '2반',
      attendanceRate: 87,
      lateCount: 3,
      earlyLeaveCount: 1,
      outingCount: 4,
      absentCount: 2,
      riskStatus: 'WARNING',
   },
   {
      traineeId: 3,
      name: '박민준',
      className: '2반',
      attendanceRate: 76,
      lateCount: 5,
      earlyLeaveCount: 2,
      outingCount: 6,
      absentCount: 5,
      riskStatus: 'EXPULSION_RISK',
   },
   {
      traineeId: 4,
      name: '최지은',
      className: '2반',
      attendanceRate: 91,
      lateCount: 2,
      earlyLeaveCount: 0,
      outingCount: 1,
      absentCount: 1,
      riskStatus: 'NORMAL',
   },
   {
      traineeId: 5,
      name: '강동원',
      className: '2반',
      attendanceRate: 82,
      lateCount: 4,
      earlyLeaveCount: 2,
      outingCount: 3,
      absentCount: 3,
      riskStatus: 'CAUTION',
   },
   {
      traineeId: 6,
      name: '정수아',
      className: '1반',
      attendanceRate: 96,
      lateCount: 0,
      earlyLeaveCount: 0,
      outingCount: 1,
      absentCount: 0,
      riskStatus: 'NORMAL',
   },
   {
      traineeId: 7,
      name: '한지민',
      className: '1반',
      attendanceRate: 79,
      lateCount: 4,
      earlyLeaveCount: 3,
      outingCount: 2,
      absentCount: 4,
      riskStatus: 'CAUTION',
   },
];

export const MOCK_TRAINEE_DETAILS: Record<number, TraineeDetail> = {
   1: {
      traineeId: 1,
      name: '김철수',
      className: '2반',
      attendanceRate: 95,
      remainingVacation: 3,
      remainingSickLeave: 3,
      present: 95,
      late: 1,
      earlyLeave: 0,
      outing: 2,
      absent: 0,
      vacation: 1,
      sickLeave: 0,
      records: buildRecords([
         ['2025-07-05', 'ABSENT'],
         ['2025-07-07', 'PRESENT'],
         ['2025-07-08', 'PRESENT'],
         ['2025-07-09', 'PRESENT'],
         ['2025-07-10', 'PRESENT'],
         ['2025-07-11', 'PRESENT'],
         ['2025-07-14', 'PRESENT'],
         ['2025-07-15', 'PRESENT'],
         ['2025-07-16', 'PRESENT'],
         ['2025-07-17', 'PRESENT'],
         ['2025-07-18', 'PRESENT'],
         ['2025-07-21', 'PRESENT'],
         ['2025-07-23', 'EARLY_LEAVE', '09:00', '15:30', '개인 사정'],
         ['2025-07-24', 'PRESENT', '09:03', '18:00'],
         ['2025-07-25', 'OUTING', '09:00', '18:00', '병원'],
         ['2025-07-28', 'ABSENT', undefined, undefined, '미연락'],
         ['2025-07-29', 'PRESENT', '09:00', '18:00'],
         ['2025-07-30', 'LATE', '09:47', '18:00', '교통 지연'],
         ['2025-07-31', 'PRESENT', '09:01', '18:00'],
      ]),
      approvals: [
         { requestedAt: '2026-07-10', type: '휴가 결재', period: '2026-07-15 ~ 2026-07-15(1일)', approvedAt: '2026-07-11' },
         { requestedAt: '2026-06-20', type: '병결 신청', period: '2026-06-21 ~ 2026-06-21(1일)', approvedAt: '2026-06-20' },
      ],
      teams: [
         { teamName: '팀 A', activePeriod: '2025-05-01 ~ 2025-05-30' },
         { teamName: '팀 D', activePeriod: '2025-03-01 ~ 2025-04-30' },
      ],
      consultations: [
         {
            consultedAt: '2025.07.20 14:00',
            counselorName: '박강사',
            title: '프로젝트 방향 피드백 — 범위 축소 및 MVP 완성 목표 설정',
            status: '완료',
         },
         {
            consultedAt: '2025.06.15 10:00',
            counselorName: '이매니저',
            title: '출결 주의 단계 안내 및 개선 계획 수립',
            status: '완료',
         },
      ],
      submissions: [
         { boxName: '팀 최종 발표자료', status: '제출완료', submittedAt: '07/30 14:32' },
         { boxName: '팀 최종 발표자료', status: '제출완료', submittedAt: '07/30 14:33' },
         { boxName: '팀 중간 발표자료', status: '미제출', submittedAt: null },
         { boxName: '중간 개인 프로젝트', status: '제출완료', submittedAt: '06/28 11:05' },
      ],
   },
};

// MOCK_TRAINEE_DETAILS에 별도 상세 목데이터가 없는 훈련생(김철수 외)은 목록의 요약 값으로
// 대략적인 상세를 만들어서 보여준다 - 목록의 모든 행이 클릭 가능해야 하기 때문
export function getTraineeDetail(traineeId: number): TraineeDetail | null {
   const explicit = MOCK_TRAINEE_DETAILS[traineeId];
   if (explicit) return explicit;

   const summary = MOCK_TRAINEES.find((trainee) => trainee.traineeId === traineeId);
   if (!summary) return null;

   return {
      traineeId: summary.traineeId,
      name: summary.name,
      className: summary.className,
      attendanceRate: summary.attendanceRate,
      remainingVacation: 3,
      remainingSickLeave: 2,
      present: summary.attendanceRate,
      late: summary.lateCount,
      earlyLeave: summary.earlyLeaveCount,
      outing: summary.outingCount,
      absent: summary.absentCount,
      vacation: 1,
      sickLeave: 0,
      records: [],
      approvals: [],
      teams: [],
      consultations: [],
      submissions: [],
   };
}
