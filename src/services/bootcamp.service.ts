import { apiFetch } from '@/lib/http';

export interface BootcampBasicInfo {
   orgName: string;
   proName: string;
}

// 부트캠프 기본 정보(조직명/프로그램명) 조회
export function getBootcampBasicInfo() {
   return apiFetch<BootcampBasicInfo>('/bootcamp/basic');
}
