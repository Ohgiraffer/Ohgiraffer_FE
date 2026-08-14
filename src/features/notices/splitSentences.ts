export type SentenceSuggestion = {
   original: string;
   improved: string;
};

// 문단(줄바꿈)과 문장 종결 부호(. ! ?) 뒤 공백을 기준으로 문장을 나눔
function splitIntoSentences(text: string): string[] {
   return text
      .split(/\n+/)
      .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+/))
      .map((sentence) => sentence.trim())
      .filter(Boolean);
}

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
