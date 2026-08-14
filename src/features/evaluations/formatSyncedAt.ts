import { format, isValid, parseISO } from 'date-fns';

export function formatSyncedAt(value: string) {
   const date = parseISO(value);
   return isValid(date) ? format(date, 'yyyy.MM.dd HH:mm') : '—';
}
