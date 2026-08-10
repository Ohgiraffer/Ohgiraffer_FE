import { Fragment } from 'react';

// AI 요약 텍스트 전용 초경량 마크다운 렌더러 - 굵게(**text**)와 문단/줄바꿈만 지원한다.
// summaryText가 항상 이 정도 문법만 쓰므로 외부 라이브러리 없이 안전하게(dangerouslySetInnerHTML 없이) 처리한다
function renderInlineMarkdown(line: string, keyPrefix: string) {
   const parts = line.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
   return parts.map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
         return <strong key={key}>{part.slice(2, -2)}</strong>;
      }
      return <Fragment key={key}>{part}</Fragment>;
   });
}

export default function MarkdownLite({ text }: { text: string }) {
   const paragraphs = text.split(/\n{2,}/);

   return (
      <>
         {paragraphs.map((paragraph, pIndex) => {
            const lines = paragraph.split('\n');
            return (
               <p key={pIndex}>
                  {lines.map((line, lIndex) => (
                     <Fragment key={lIndex}>
                        {lIndex > 0 && <br />}
                        {renderInlineMarkdown(line, `${pIndex}-${lIndex}`)}
                     </Fragment>
                  ))}
               </p>
            );
         })}
      </>
   );
}
