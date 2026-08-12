import type { NotificationItem } from './types';

// 백엔드 알림 API 연동 전까지 화면 확인용으로 쓰는 더미 데이터
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
   {
      id: 'notification-1',
      title: '필수 공지사항 등록',
      description: '7월 중간 평가 일정 안내가 등록되었습니다.',
      timestamp: '10분 전',
      isRead: false,
      link: '/notices/notice-1',
   },
   {
      id: 'notification-2',
      title: '일정 알림',
      description: '내일 오전 10시 팀 발표가 예정되어 있습니다.',
      timestamp: '1시간 전',
      isRead: false,
      link: '/',
   },
   {
      id: 'notification-3',
      title: '결재 승인',
      description: '휴가 신청이 승인되었습니다.',
      timestamp: '3시간 전',
      isRead: true,
      link: '/approvals',
   },
   {
      id: 'notification-4',
      title: '출결 경고',
      description: '출석률이 경고 단계에 근접하고 있습니다.',
      timestamp: '어제',
      isRead: false,
      link: '/tracker',
   },
   {
      id: 'notification-5',
      title: '새 메시지',
      description: '박강사님이 채팅방에 메시지를 남겼습니다.',
      timestamp: '어제',
      isRead: true,
   },
   {
      id: 'notification-6',
      title: '제출 마감 임박',
      description: '팀 최종 발표자료 제출 마감까지 3일 남았습니다.',
      timestamp: '2일 전',
      isRead: true,
      link: '/submissions',
   },
];
