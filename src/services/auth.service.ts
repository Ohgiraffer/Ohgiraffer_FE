import { apiFetch, refreshAccessToken } from '@/lib/http';

export type UserRole = 'STUDENT' | 'MANAGER' | 'INSTRUCTOR';

export const ROLE_LABELS: Record<UserRole, string> = {
   STUDENT: '훈련생',
   MANAGER: '매니저',
   INSTRUCTOR: '강사',
};

export interface LoginRequest {
   email: string;
   password: string;
}

export interface LoginResponse {
   accessToken: string;
   role: UserRole;
   status: string;
}

export interface RefreshResponse {
   accessToken: string;
}

export function login(body: LoginRequest) {
   return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      skipAuth: true,
      skipRefreshRetry: true,
   });
}

export async function refresh(): Promise<RefreshResponse> {
   const accessToken = await refreshAccessToken();
   return { accessToken };
}

export function logout() {
   // 백엔드 스펙상 Refresh-Token 헤더도 함께 요구하지만, 리프레시 토큰은 httpOnly 쿠키라
   // 프론트에서 값을 읽어 헤더에 담을 수 없다. credentials:'include'로 쿠키 자체는 함께
   // 전송되니, 백엔드가 쿠키 형태도 허용하는지 확인이 필요하다 (미확인 상태로 우선 진행).
   return apiFetch<void>('/auth/logout', {
      method: 'POST',
      skipRefreshRetry: true,
   });
}

export interface ResetPasswordResponse {
   needResetPw: boolean;
   message: string;
}

export function resetPassword(newPassword: string) {
   // apiFetch가 로그인 시 저장된 accessToken을 Authorization 헤더로 자동으로 붙여준다
   return apiFetch<ResetPasswordResponse>('/user/pw-reset', {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
   });
}
