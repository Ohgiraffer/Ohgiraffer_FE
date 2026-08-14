// 운영진 "가능 시간 등록" 탭에서 쓰는 09:00~19:00 30분 단위 슬롯
export type CounselingTimeSlot = {
   time: string;
   isOpen: boolean;
   isBooked: boolean;
};
