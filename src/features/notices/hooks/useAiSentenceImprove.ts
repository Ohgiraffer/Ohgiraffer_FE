'use client';

import { useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { generateGeminiText, GeminiApiError, type GeminiErrorKind } from '@/lib/gemini';
import { getAiRewriteKey } from '@/services/notice.service';
import { buildSentenceSuggestions, type SentenceSuggestion } from '../splitSentences';

// 문장 개선 프롬프트 (구조: 프롬프트 + 사용자 작성 본문)
const REWRITE_PROMPT_PREFIX =
   '다음은 부트캠프 공지사항의 초안이야. 의미는 그대로 유지하면서 공식적이고 정중한 공지 문체로 다듬어줘. ' +
   '날짜·시간·이름·숫자 같은 사실 정보는 절대 바꾸지 말고 원문 그대로 유지해줘. ' +
   '원문에 없는 내용을 새로 추가하거나 원문의 내용을 생략하지 마. ' +
   '원문의 문장을 합치거나 나누지 말고, 반드시 원문과 정확히 같은 개수의 문장·줄바꿈 구조로 다듬어줘. ' +
   '다른 설명 없이 다듬은 본문만 그대로 출력해줘.\n\n';

// Gemini 쪽 오류 종류별 대응
const GEMINI_ERROR_MESSAGES: Record<GeminiErrorKind, string> = {
   invalid_key: 'AI 설정에 문제가 있습니다. 관리자에게 문의해주세요.',
   credits_depleted: 'AI 사용 한도가 모두 소진되었습니다. 관리자에게 문의해주세요.',
   rate_limited: 'AI 호출이 잠시 몰렸습니다. 잠시 후 다시 시도해주세요.',
   server_error: 'AI 서비스에 일시적인 장애가 발생했습니다. 잠시 후 다시 시도해주세요.',
   unknown: '문장 개선 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
};

// 공지 작성/수정 화면의 [AI 문장 개선]
export function useAiSentenceImprove() {
   const [isImproving, setIsImproving] = useState(false);
   const isImprovingRef = useRef(false);
   const [suggestions, setSuggestions] = useState<SentenceSuggestion[]>([]);
   const [improvedFullText, setImprovedFullText] = useState('');

   const improve = async (originalText: string) => {
      if (isImprovingRef.current) return;

      const trimmed = originalText.trim();
      if (!trimmed) {
         toast.warning('개선하고자 하는 문장을 입력해주세요.');
         return;
      }

      isImprovingRef.current = true;
      setIsImproving(true);
      try {
         const { apiKey, model } = await getAiRewriteKey();
         const improved = await generateGeminiText(apiKey, model, `${REWRITE_PROMPT_PREFIX}${trimmed}`);
         setSuggestions(buildSentenceSuggestions(trimmed, improved));
         setImprovedFullText(improved.trim());
      } catch (err) {
         if (err instanceof GeminiApiError) {
            toast.error(GEMINI_ERROR_MESSAGES[err.kind]);
         } else {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : 'AI 문장 개선 기능을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      } finally {
         isImprovingRef.current = false;
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
         toast.success('복사되었습니다.');
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
