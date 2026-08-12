// 라우트 경로의 noticeId 문자열을 안전하게 숫자로 변환한다. Number()만 쓰면 " "(공백→0),
// "1e3"(지수 표기→1000), "0"/"-5"(0 이하) 같은 값도 Number.isInteger를 통과해버려서, 실제로
// "양의 정수 문자열" 형태인지부터 정규식으로 확인한 뒤에만 변환한다
export function parseNoticeId(raw: string | undefined): number | undefined {
   if (!raw || !/^[1-9]\d*$/.test(raw)) return undefined;
   const id = Number(raw);
   return Number.isSafeInteger(id) ? id : undefined;
}
