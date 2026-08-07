// 온보딩 1단계와 관리자 설정 "조직·출결" 탭이 공유하는 부트캠프 기본 정보
export type BootcampOrgInfo = {
   orgName: string;
   courseName: string;
   startDate: string;
   endDate: string;
};

// 위와 마찬가지로 두 화면이 공유하는 출결 단위기간 한 건
export type BootcampPeriod = {
   id: string;
   startDate: string;
   endDate: string;
};
