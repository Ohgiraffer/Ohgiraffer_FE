// Gemini API 직접 호출하는 클라이언트
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// 구글 쪽 오류를 직접 받아 종류별로 다르게 안내
// - invalid_key(400): 키 자체가 잘못됨 - 재시도해봐야 소용없는 백엔드 설정 문제
// - credits_depleted(429 + 크레딧 소진 문구): 기다려도 안 풀림 - "잠시 후 재시도"로 안내하면 안 됨
// - rate_limited(429 + 그 외, 분당 호출 한도): 잠시 후 재시도하면 풀림
// - server_error(500/503): 구글 쪽 일시 장애 - 잠시 후 재시도
// - unknown: 그 외(응답 형식이 다르거나 네트워크 오류 등)
export type GeminiErrorKind =
   | 'invalid_key'
   | 'credits_depleted'
   | 'rate_limited'
   | 'server_error'
   | 'unknown';

export class GeminiApiError extends Error {
   kind: GeminiErrorKind;

   constructor(message: string, kind: GeminiErrorKind = 'unknown') {
      super(message);
      this.name = 'GeminiApiError';
      this.kind = kind;
   }
}

function classifyGeminiErrorKind(status: number, errorMessage: string): GeminiErrorKind {
   if (status === 400) return 'invalid_key';
   if (status === 429) {
      return /credit/i.test(errorMessage) ? 'credits_depleted' : 'rate_limited';
   }
   if (status === 500 || status === 503) return 'server_error';
   return 'unknown';
}

// generateContent 응답에서 실제 텍스트만 뽑아낸다 - 후보가 없거나 형태가 다르면 에러로 처리
function extractGeneratedText(data: unknown): string {
   const text = (
      data as {
         candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      }
   )?.candidates?.[0]?.content?.parts?.[0]?.text;

   if (typeof text !== 'string' || !text.trim()) {
      throw new GeminiApiError('Gemini 응답에서 텍스트를 찾을 수 없습니다.');
   }
   return text;
}

export async function generateGeminiText(
   apiKey: string,
   model: string,
   prompt: string,
): Promise<string> {
   const res = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
         contents: [{ parts: [{ text: prompt }] }],
      }),
   });

   if (!res.ok) {
      const body = await res.json().catch(() => null);
      const errorMessage: string =
         (body as { error?: { message?: string } } | null)?.error?.message ?? '';
      const kind = classifyGeminiErrorKind(res.status, errorMessage);
      throw new GeminiApiError(
         errorMessage || `Gemini API 요청이 실패했습니다. (status ${res.status})`,
         kind,
      );
   }

   const data = await res.json().catch(() => null);
   return extractGeneratedText(data);
}
