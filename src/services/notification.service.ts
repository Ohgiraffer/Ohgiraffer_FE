import { apiFetch } from '@/lib/http';

// 문서화된 값 외에 새 도메인이 추가될 수 있어 문자열로 둔다
export type NotificationType = 'APPROVAL_RESULT' | 'CHAT_MENTION' | (string & {});
export type RelatedEntityType =
   | 'APPROVAL'
   | 'NOTICE'
   | 'CALENDAR'
   | 'ATTENDANCE'
   | 'CONSULTATION'
   | 'SUBMISSION'
   | 'CHAT'
   | (string & {});

export interface NotificationDto {
   notificationId: number;
   notificationType: NotificationType;
   title: string;
   content: string;
   relatedEntityType: RelatedEntityType | null;
   relatedEntityId: number | null;
   isRead: boolean;
   createdAt: string;
}

// 알림 목록 조회 - 스펙상 조회인데도 POST로 정의돼 있어 그대로 따름(바디 없음)
export function getNotifications() {
   return apiFetch<NotificationDto[]>('/notifications', { method: 'POST' });
}

export function markNotificationAsRead(notificationId: number) {
   return apiFetch<NotificationDto>(`/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export function deleteNotification(notificationId: number) {
   return apiFetch<void>(`/notifications/${notificationId}`, { method: 'DELETE' });
}

export interface DeleteNotificationsResult {
   deletedCount: number;
}

export function deleteNotifications(notificationIds: number[]) {
   return apiFetch<DeleteNotificationsResult>('/notifications', {
      method: 'DELETE',
      body: JSON.stringify({ notificationIds }),
   });
}

export interface UnreadNotificationCountResponse {
   unreadCount: number;
}

// 상단바 배지 전용 경량 엔드포인트 - 실시간 구독(SSE) 대신 이 값을 주기적으로 확인하는 폴링에 사용
export function getUnreadNotificationCount() {
   return apiFetch<UnreadNotificationCountResponse>('/notifications/unread-count');
}

// 알림 생성(POST /notifications, 바디 있음)은 각 도메인이 서버 내부에서만 호출하는 API라 프론트에서는 쓰지 않는다
