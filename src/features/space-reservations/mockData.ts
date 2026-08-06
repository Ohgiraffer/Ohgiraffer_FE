import type { SpacePerson, SpaceZone } from './types';

// 백엔드 실시간 위치 추적 연동 전까지 화면 확인용으로 쓰는 더미 데이터
export const MOCK_ZONES: SpaceZone[] = [
   { id: 'zone-a', name: 'A 구역 (1층)', capacity: 12 },
   { id: 'zone-b', name: 'B 구역 (2층)', capacity: 10 },
   { id: 'zone-meeting', name: '회의실 (2층)', capacity: 8 },
   { id: 'zone-lounge', name: '휴게실 (1층)', capacity: 6 },
];

export const MOCK_PEOPLE: SpacePerson[] = [
   { id: 'person-1', name: '김철수', team: '팀 A', zoneId: 'zone-a' },
   { id: 'person-2', name: '이영희', team: '팀 B', zoneId: 'zone-a' },
   { id: 'person-3', name: '박민준', team: '팀 A', zoneId: 'zone-a' },
   { id: 'person-4', name: '최지은', team: '팀 C', zoneId: 'zone-a' },
   { id: 'person-5', name: '강동원', team: '팀 B', zoneId: 'zone-a' },
   { id: 'person-6', name: '홍길동', team: '팀 D', zoneId: 'zone-a', isCurrentUser: true },
   { id: 'person-7', name: '한지수', team: '팀 C', zoneId: 'zone-b' },
   { id: 'person-8', name: '오세훈', team: '팀 A', zoneId: 'zone-b' },
   { id: 'person-9', name: '임나영', team: '팀 B', zoneId: 'zone-b' },
   { id: 'person-10', name: '박강사', team: '강사', zoneId: 'zone-meeting' },
   { id: 'person-11', name: '이매니저', team: '매니저', zoneId: 'zone-meeting' },
   { id: 'person-12', name: '김민수', team: '팀 A', zoneId: 'zone-lounge' },
];
