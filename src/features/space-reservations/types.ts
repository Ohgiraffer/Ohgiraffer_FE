export type SpaceZone = {
   id: string;
   name: string;
   capacity: number;
};

export type SpacePerson = {
   id: string;
   name: string;
   team: string;
   // 현재 위치한 구역 id - 아직 어디에도 체크인하지 않았다면 null
   zoneId: string | null;
   // 로그인한 사용자 본인 여부 - "(나)" 표기 및 입실 대상 판별에 사용
   isCurrentUser?: boolean;
};
