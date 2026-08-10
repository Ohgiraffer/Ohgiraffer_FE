import { apiFetch } from '@/lib/http';

export interface BootcampBasicInfo {
   orgName: string;
   proName: string;
}

// 부트캠프 기본 정보(조직명/프로그램명) 조회 - 전체 role 공용.
// /bootcamp/settings(매니저 전용 "조직·출결 설정" API)와 달리 누구나 호출 가능해서 대시보드
// 헤더처럼 role 상관없이 노출되는 화면에서 써야 함
export function getBootcampBasicInfo() {
   return apiFetch<BootcampBasicInfo>('/bootcamp/basic');
}
