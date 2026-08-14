// Gemini API를 백엔드를 거치지 않고 브라우저에서 직접 호출하는 클라이언트.
// 브라우저 fetch 대상 도메인에 CORS(Access-Control-Allow-Origin/Headers)가 열려있는 걸 확인함 -
// 백엔드가 발급해주는 apiKey/model만 있으면 프론트에서 바로 요청 가능하다
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiApiError extends Error {
   constructor(message: string) {
      super(message);
      this.name = 'GeminiApiError';
   }
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

// 프롬프트 하나를 보내고 생성된 텍스트를 그대로 받는다(대화 이력 없음, 단발성 호출).
// apiKey는 백엔드가 그때그때 발급해주는 값을 그대로 헤더에 실어 보낸다
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
      throw new GeminiApiError(`Gemini API 요청이 실패했습니다. (status ${res.status})`);
   }

   const data = await res.json().catch(() => null);
   return extractGeneratedText(data);
}
