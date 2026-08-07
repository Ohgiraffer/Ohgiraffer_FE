import type { ManagerSettingUser } from './types';

// "조직·출결"·"변경 이력" 탭은 각각 /bootcamp/settings, /bootcamp/settings/logs API로 연동되어
// 더 이상 mock을 쓰지 않음. 아래는 아직 백엔드 연동 전인 "사용자·권한" 탭에서 화면 확인용으로 쓰는 더미 데이터

export const MOCK_USERS: ManagerSettingUser[] = [
   {
      id: 'user-1',
      name: '김철수',
      email: 'chulsoo@camp.kr',
      role: '훈련생',
      team: '팀 A',
      status: '활성',
   },
   {
      id: 'user-2',
      name: '이영희',
      email: 'younghee@camp.kr',
      role: '훈련생',
      team: '팀 B',
      status: '활성',
   },
   {
      id: 'user-3',
      name: '박민준',
      email: 'minjun@camp.kr',
      role: '훈련생',
      team: '팀 A',
      status: '활성',
   },
   {
      id: 'user-4',
      name: '박강사',
      email: 'instructor@camp.kr',
      role: '강사',
      team: null,
      status: '활성',
   },
   {
      id: 'user-5',
      name: '이매니저',
      email: 'manager@camp.kr',
      role: '매니저',
      team: null,
      status: '활성',
   },
   {
      id: 'user-6',
      name: '최탈퇴',
      email: 'old@camp.kr',
      role: '훈련생',
      team: null,
      status: '삭제됨',
   },
   {
      id: 'user-7',
      name: '정하나',
      email: 'hana@camp.kr',
      role: '훈련생',
      team: '팀 B',
      status: '활성',
   },
   {
      id: 'user-8',
      name: '최강사',
      email: 'instructor2@camp.kr',
      role: '강사',
      team: null,
      status: '활성',
   },
];
