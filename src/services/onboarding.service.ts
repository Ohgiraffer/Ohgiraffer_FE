import { apiFetch } from '@/lib/http';

export interface BootcampInfoPayload {
   orgName: string;
   proName: string;
   startDate: string;
   endDate: string;
}

export interface CreateBootcampInfoResponse {
   bootcampId: number;
}

// 최초 온보딩 1단계 "다음" - 부트캠프 정보를 등록하고 이후 요청에 쓸 bootcampId를 발급받음
export function createBootcampInfo(body: BootcampInfoPayload) {
   return apiFetch<CreateBootcampInfoResponse>('/bootcamp/info', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface PatchBootcampInfoPayload extends Partial<BootcampInfoPayload> {
   bootcampId: number;
}

// 1단계로 [이전] 후 값을 수정하고 다시 "다음" - 바뀐 필드만 담아 보냄
export function patchBootcampInfo(body: PatchBootcampInfoPayload) {
   return apiFetch<void>('/bootcamp/info', {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

export interface BootcampPolicyPeriod {
   periodNo: number;
   periodStart: string;
   periodEnd: string;
}

export interface CreateBootcampPolicyPayload {
   bootcampId: number;
   periods: BootcampPolicyPeriod[];
   cautionPercent: number;
   warningPercent: number;
   expulsionPercent: number;
}

// 4단계 "완료"
export function createBootcampPolicy(body: CreateBootcampPolicyPayload) {
   return apiFetch<void>('/bootcamp/policy', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}
