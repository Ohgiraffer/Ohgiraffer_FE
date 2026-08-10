import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';

export interface Me {
   userId: number;
   name: string;
   phone: string;
   email: string;
   role: UserRole;
   profileImgUrl: string | null;
   joinDate: string;
   status: string;
   notificationOn: boolean;
}

export function getMe() {
   return apiFetch<Me>('/user/me');
}

export interface UserListItem {
   userId: number;
   name: string;
   email: string;
   role: UserRole;
   teamName: string | null;
   status: string;
}

// 새 채팅 상대 선택 목록 등 전체 사용자 명단이 필요한 곳에서 사용 - 운영진(매니저/강사)만 호출 가능
export function getUserList() {
   return apiFetch<UserListItem[]>('/user/list');
}

export interface RegisterUserRow {
   name: string;
   email: string;
   phone: string;
   // 훈련생/강사/매니저 같은 한국어 문자열 그대로 보냄 - enum 매핑은 백엔드에서 처리
   role: string;
}

export interface RegisterUsersPayload {
   rows: RegisterUserRow[];
}

// 관리자 설정 > 사용자 및 권한 관리 > "+ 사용자 등록"(직접 입력 탭) - 성공 시 응답 본문 없음
export function registerUsers(body: RegisterUsersPayload) {
   return apiFetch<void>('/user/register', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}
