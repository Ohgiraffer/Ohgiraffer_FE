export function parseNoticeId(raw: string | undefined): number | undefined {
   if (!raw || !/^[1-9]\d*$/.test(raw)) return undefined;
   const id = Number(raw);
   return Number.isSafeInteger(id) ? id : undefined;
}
