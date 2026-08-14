// 09:00 ~ 19:00, 30분 단위 고정 상담 시간 슬롯 - 등록(운영진)·신청(훈련생) 탭 공용
export const ALL_TIME_SLOTS: string[] = Array.from({ length: 21 }, (_, index) => {
   const totalMinutes = 9 * 60 + index * 30;
   const hour = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
   const minute = String(totalMinutes % 60).padStart(2, '0');
   return `${hour}:${minute}`;
});
