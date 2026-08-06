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
   bootcampId: number | null;
   need_reset_pw: boolean;
}

export interface RefreshResponse {
   userId: number;
   accessToken: string;
   role: UserRole;
   status: string;
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
   const data = await refreshAccessToken();
   return { ...data, role: data.role as UserRole };
}

export function logout() {
   // 리프레시 토큰은 httpOnly 쿠키라 credentials:'include'로 자동 전송되고, 별도 헤더는 필요 없다
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

export interface UploadProfileImageResponse {
   profileImgUrl: string;
}

export function uploadProfileImage(file: File) {
   const formData = new FormData();
   formData.append('profileImg', file);
   // FormData를 body로 넘기면 apiFetch가 Content-Type을 붙이지 않아 브라우저가
   // boundary 포함한 multipart/form-data 헤더를 알아서 채움
   return apiFetch<UploadProfileImageResponse>('/user/profile-image', {
      method: 'PATCH',
      body: formData,
   });
}

export function deleteProfileImage() {
   // 204 No Content — apiFetch가 status 204를 undefined로 처리해줌
   return apiFetch<void>('/user/profile-image', {
      method: 'DELETE',
   });
}
