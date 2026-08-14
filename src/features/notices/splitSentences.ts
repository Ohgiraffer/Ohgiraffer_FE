export type SentenceSuggestion = {
   original: string;
   improved: string;
};

// 문단(줄바꿈)과 문장 종결 부호(. ! ?) 뒤 공백을 기준으로 문장을 나눈다. 빈 문장은 제외
function splitIntoSentences(text: string): string[] {
   return text
      .split(/\n+/)
      .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
      .map((sentence) => sentence.trim())
      .filter(Boolean);
}

// 원문/개선문을 문장 단위로 나눠 나란히 짝지어준다. AI가 문장을 합치거나 나눠서 개수가 안 맞으면
// 문장별로 잘못 짝지어 보여주는 것보다, 전체를 한 덩어리로 비교하는 게 덜 헷갈린다
export function buildSentenceSuggestions(
   originalText: string,
   improvedText: string,
): SentenceSuggestion[] {
   const originalSentences = splitIntoSentences(originalText);
   const improvedSentences = splitIntoSentences(improvedText);

   if (originalSentences.length > 0 && originalSentences.length === improvedSentences.length) {
      return originalSentences.map((original, index) => ({
         original,
         improved: improvedSentences[index],
      }));
   }

   return [{ original: originalText.trim(), improved: improvedText.trim() }];
}
