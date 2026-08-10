import { apiFetch, apiFetchBlob } from '@/lib/http';
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

export interface UserListItem {
   userId: number;
   name: string;
   email: string;
   role: UserRole;
   // 훈련생만 소속 팀이 있고, 강사·매니저는 항상 null
   teamName: string | null;
   status: UserStatus;
   // 백엔드 지원 예정(합의됨) - 아직 없거나 로드 실패 시 ChatAvatar가 기본 아이콘으로 대체
   profileImageUrl: string | null;
}

// 관리자 설정 > 사용자 및 권한 관리 - 전체 사용자 목록 조회
export function getUserList() {
   return apiFetch<UserListItem[]>('/user/list');
}

// 관리자 설정 > 사용자 및 권한 관리 > "+ 사용자 등록" > 파일 업로드 탭 - 등록용 엑셀 템플릿 다운로드.
// Authorization 헤더가 필요해 <a href>가 아니라 blob으로 받아 내려받는다
export function downloadUserRegisterTemplate() {
   return apiFetchBlob('/user/register/template');
}

export interface ExtractedUserRow {
   rowNumber: number;
   name: string;
   email: string;
   phone: string;
   // 파일에 적힌 역할 원문 그대로("학생", "운영진" 등 다양한 표기 허용) - 인식 실패 시 errors에 안내가 담김
   rawRole: string;
   valid: boolean;
   errors: string[];
}

export interface ExtractUsersFromFileResult {
   filename: string;
   rows: ExtractedUserRow[];
}

// 관리자 설정 > 사용자 및 권한 관리 > "+ 사용자 등록" > 파일 업로드 탭 - 첨부한 CSV/엑셀에서 사용자 행을
// 추출하고 행별로 검증한다(이름/이메일/전화번호/역할 인식, 이메일 중복 등)
export function extractUsersFromFile(file: File) {
   const formData = new FormData();
   formData.append('file', file);
   return apiFetch<ExtractUsersFromFileResult>('/user/file/info', {
      method: 'POST',
      body: formData,
   });
}

export type UserStatus = 'ACTIVE' | 'COMPLETED' | 'WITHDRAWN' | 'EXPELLED';

export interface UpdateUserStatusPayload {
   userId: number;
   // 이 API는 자퇴(WITHDRAWN)/제적(EXPELLED) 처리 전용 - ACTIVE/COMPLETED로는 변경 불가(400 USER_006)
   status: UserStatus;
}

// 관리자 설정 > 사용자 및 권한 관리 - 훈련생 자퇴/제적 처리. 이미 자퇴·제적됐거나(409 USER_007)
// 수료 완료된(409 USER_005) 사용자는 거절됨. 성공 시 응답 본문 없음
export function updateUserStatus(body: UpdateUserStatusPayload) {
   return apiFetch<void>('/user/status', {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}
