import { format, isValid, parseISO } from 'date-fns';

// 팀 시작일/종료일(yyyy-MM-dd)을 "2025-06-01 ~ 2025-08-30" 형태로 표시
export function formatTeamPeriod(startDate: string | null, endDate: string | null) {
   const start = formatTeamDate(startDate);
   const end = formatTeamDate(endDate);
   if (!start && !end) return '기간 미정';
   return `${start || '?'} ~ ${end || '?'}`;
}

function formatTeamDate(value: string | null) {
   if (!value) return '';
   const date = parseISO(value);
   return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
}
