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

// 공지 작성/수정 화면의 [AI 문장 개선] - 클릭 한 번에 두 API가 순차로 호출된다.
// ① 우리 백엔드(GET /notices/ai-rewrite-key)에서 Gemini API 키/모델명만 받아오고,
// ② 그 키로 Gemini API를 브라우저에서 직접 호출해 본문을 다듬는다(공지 내용은 ①에 실리지 않음).
// 실제 반영은 자동으로 되지 않고, 사용자가 제안 패널에서 문장별 복사 또는 전체 적용을 직접 선택해야 한다
export function useAiSentenceImprove() {
   const [isImproving, setIsImproving] = useState(false);
   const [suggestions, setSuggestions] = useState<SentenceSuggestion[]>([]);
   // "전체 적용" 버튼이 그대로 쓸 수 있도록 개선된 본문 전체도 따로 들고 있는다(문장별 짝짓기가
   // 실패해 suggestions가 1개짜리 폴백이어도 전체 적용은 항상 정상 동작해야 함)
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

   // 패널을 닫으면 다음번엔 새로 개선 요청을 해야 하므로 결과도 함께 비운다
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
