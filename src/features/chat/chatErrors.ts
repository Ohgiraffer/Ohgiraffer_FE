import { ApiError } from '@/lib/http';

const CHAT_ERROR_MESSAGES: Record<string, string> = {
   AUTH_001: '인증이 필요합니다. 다시 로그인해주세요.',
   CHAT_001: '채팅 채널을 찾을 수 없습니다.',
   CHAT_002: '메시지를 찾을 수 없습니다.',
   CHAT_003: '답글을 찾을 수 없습니다.',
   CHAT_004: '본인이 작성한 메시지만 수정·삭제할 수 있습니다.',
   CHAT_005: '이미 삭제된 메시지입니다.',
   CHAT_006: 'Sendbird 서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
   COMMON_001: '입력값이 올바르지 않습니다.',
   COMMON_002: '요청 본문이 올바르지 않습니다.',
   COMMON_003: '필수 요청 파라미터가 누락되었습니다.',
};

// err.code가 위 표에 있으면 고정 문구, 없으면 백엔드가 내려준 message, 그것도 없으면 fallback을 쓴다
export function getChatErrorMessage(err: unknown, fallback: string) {
   if (err instanceof ApiError) {
      return CHAT_ERROR_MESSAGES[err.code] ?? err.message;
   }
   return fallback;
}
