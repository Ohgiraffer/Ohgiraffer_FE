import { formatDistanceToNowStrict } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { NotificationDto } from '@/services/notification.service';
import type { NotificationItem } from './types';

// relatedEntityType+Id → 이동할 페이지. 상세 페이지가 있는 도메인은 상세로, 없는 도메인은 목록/홈으로 보낸다.
// 채팅은 페이지가 없고 우측 패널이라 별도로 처리한다(resolveNotificationTarget)
function buildLink(relatedEntityType: string | null, relatedEntityId: number | null): string | undefined {
   switch (relatedEntityType) {
      case 'APPROVAL':
         return relatedEntityId != null ? `/approvals/${relatedEntityId}` : '/approvals';
      case 'NOTICE':
         return relatedEntityId != null ? `/notices/${relatedEntityId}` : '/notices';
      case 'CONSULTATION':
         return relatedEntityId != null ? `/counseling/${relatedEntityId}` : '/counseling';
      case 'ATTENDANCE':
         return '/tracker';
      case 'SUBMISSION':
         return '/submissions';
      case 'CALENDAR':
         return '/';
      default:
         return undefined;
   }
}

function resolveNotificationTarget(dto: NotificationDto): { link?: string; opensChatPanel?: boolean } {
   if (dto.notificationType === 'CHAT_MENTION' || dto.relatedEntityType === 'CHAT') {
      return { opensChatPanel: true };
   }
   return { link: buildLink(dto.relatedEntityType, dto.relatedEntityId) };
}

export function mapNotificationDto(dto: NotificationDto): NotificationItem {
   return {
      id: dto.notificationId,
      title: dto.title,
      description: dto.content,
      timestamp: formatDistanceToNowStrict(new Date(dto.createdAt), { addSuffix: true, locale: ko }),
      isRead: dto.isRead,
      ...resolveNotificationTarget(dto),
   };
}
