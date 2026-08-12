import type { UserRole } from '@/services/auth.service';

export type SpaceOccupant = {
   userId: number;
   userName: string;
   role: UserRole;
   // 로그인한 사용자 본인 여부 - "(나)" 표기 및 퇴실 대상 판별에 사용
   mine: boolean;
   // 아직 공식 문서에는 반영되지 않은 필드 - 백엔드가 우선 바디에 추가해준 상태라 optional로 방어적으로 받는다.
   // 필드명이 다르거나 응답에 아예 없으면 문서 업데이트 후 다시 확인 필요
   profileImgUrl?: string | null;
};

export type Space = {
   spaceId: number;
   spaceName: string;
   capacity: number;
   // 현재 위치한 활성 사용자 수 (occupants.length와 동일)
   currentCount: number;
   availableCount: number;
   occupants: SpaceOccupant[];
};

// PATCH /spaces/my-location 응답 - 위치 해제 시 spaceId/spaceName은 null
export type MyLocationResult = {
   userId: number;
   userName: string;
   role: UserRole;
   spaceId: number | null;
   spaceName: string | null;
};

// POST /spaces 요청 본문 - 강사·매니저 전용
export type SpaceWriteRequest = {
   spaceName: string;
   capacity: number;
};
