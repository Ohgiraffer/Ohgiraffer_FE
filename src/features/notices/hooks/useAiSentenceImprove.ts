'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { generateGeminiText, GeminiApiError } from '@/lib/gemini';
import { getAiRewriteKey } from '@/services/notice.service';
import { buildSentenceSuggestions, type SentenceSuggestion } from '../splitSentences';

const REWRITE_PROMPT_PREFIX =
   '다음은 부트캠프 공지사항 초안이야. 의미는 그대로 유지하면서 공식적이고 정중한 공지 문체로 다듬어줘. ' +
   '문장 수와 줄바꿈 구조는 최대한 원문과 비슷하게 유지하고, 다른 설명 없이 다듬은 본문만 그대로 출력해줘.\n\n';

// 공지 작성/수정 화면의 [AI 문장 개선]
export function useAiSentenceImprove() {
   const [isImproving, setIsImproving] = useState(false);
   const [suggestions, setSuggestions] = useState<SentenceSuggestion[]>([]);
   const [improvedFullText, setImprovedFullText] = useState('');

   const improve = async (originalText: string) => {
      const trimmed = originalText.trim();
      if (!trimmed || isImproving) return;

      setIsImproving(true);
      try {
         const { apiKey, model } = await getAiRewriteKey();
         const improved = await generateGeminiText(apiKey, model, `${REWRITE_PROMPT_PREFIX}${trimmed}`);
         setSuggestions(buildSentenceSuggestions(trimmed, improved));
         setImprovedFullText(improved.trim());
      } catch (err) {
         if (err instanceof GeminiApiError) {
            toast.error('문장 개선 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : 'AI 문장 개선 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         setIsImproving(false);
      }
   };

   const close = () => {
      setSuggestions([]);
      setImprovedFullText('');
   };

   const copySuggestion = async (text: string) => {
      try {
         await navigator.clipboard.writeText(text);
         toast.success('복사했습니다.');
      } catch {
         toast.error('복사에 실패했습니다.');
      }
   };

   return {
      isImproving,
      suggestions,
      improvedFullText,
      improve,
      close,
      copySuggestion,
   };
}
