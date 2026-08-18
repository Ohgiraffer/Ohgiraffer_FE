import { format, isValid } from 'date-fns';

// 결재 신청일자/휴가 시작·종료일처럼 날짜만 표시하는 곳
export function formatApprovalDate(value: string) {
   const date = new Date(value);
   return isValid(date) ? format(date, 'yyyy-MM-dd') : '-';
}

// 결재 타임라인의 확인/처리 시각, 예산 마지막 동기화 시각처럼 시간까지 표시하는 곳
export function formatApprovalDateTime(value: string) {
   const date = new Date(value);
   return isValid(date) ? format(date, 'yyyy-MM-dd HH:mm') : '-';
}
