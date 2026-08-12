import { format, isValid } from 'date-fns';

export function formatNoticeDate(createdAt: string | null | undefined) {
   if (!createdAt) return '-';
   const date = new Date(createdAt);
   return isValid(date) ? format(date, 'yyyy-MM-dd') : '-';
}
