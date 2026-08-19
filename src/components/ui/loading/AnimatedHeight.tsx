'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedHeightProps {
   children: React.ReactNode;
   className?: string;
   // 이 값이 바뀔 때만(예: 로딩 -> 콘텐츠 전환) 높이 변화를 애니메이션한다. 값이 그대로면(예:
   // 페이지네이션처럼 같은 콘텐츠 종류 안에서 내용만 바뀌는 경우) 즉시 스냅한다 - 매번 애니메이션
   // 하면 바로 아래 붙은 페이지네이션 버튼이 클릭할 때마다 계속 흔들려 보인다. 안 넘기면(기본)
   // 항상 애니메이션한다
   transitionKey?: string | number;
}

// 스켈레톤 -> 실제 콘텐츠처럼 자식의 높이가 갑자기 바뀔 때, 그 차이를 즉시 반영하지 않고
// height를 트랜지션으로 부드럽게 따라가게 한다. height: auto는 CSS로 직접 트랜지션할 수 없어서
// ResizeObserver로 안쪽 콘텐츠의 실제 높이를 측정해 바깥 래퍼의 height를 픽셀 값으로 갈아 끼운다
export default function AnimatedHeight({
   children,
   className = '',
   transitionKey,
}: AnimatedHeightProps) {
   const wrapperRef = useRef<HTMLDivElement>(null);
   const contentRef = useRef<HTMLDivElement>(null);
   const [height, setHeight] = useState<number>();
   // 매 렌더 후(useEffect, no deps) 최신 transitionKey를 반영한다 - 렌더 중 ref 읽기는 금지라
   // ResizeObserver 콜백(비동기) 안에서 "지금 key"를 알아내려면 이렇게 별도로 동기화해둬야 한다
   const currentKeyRef = useRef(transitionKey);
   const lastSeenKeyRef = useRef(transitionKey);
   const tracksKeyRef = useRef(transitionKey !== undefined);

   useEffect(() => {
      currentKeyRef.current = transitionKey;
   });

   useEffect(() => {
      const el = contentRef.current;
      if (!el) return;

      const observer = new ResizeObserver((entries) => {
         const entry = entries[0];
         if (!entry) return;

         if (tracksKeyRef.current) {
            const changed = currentKeyRef.current !== lastSeenKeyRef.current;
            lastSeenKeyRef.current = currentKeyRef.current;
            // key가 안 바뀐 변화(페이지네이션 등)는 이번 갱신 한 번만 트랜지션을 꺼서 즉시
            // 스냅시키고, 다음 프레임에 다시 켠다 - React state로 클래스를 같이 토글하면 "트랜지션이
            // 걸리는 시점"과 "높이가 바뀌는 시점"이 같은 커밋에 몰려서 브라우저가 애니메이션할
            // 이전 프레임을 못 잡고 그냥 순간 이동해버리기 때문에, DOM에 직접 duration을 0으로
            // 박아 넣어야 한다
            const wrapperEl = wrapperRef.current;
            if (!changed && wrapperEl) {
               wrapperEl.style.transitionDuration = '0s';
               requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                     wrapperEl.style.transitionDuration = '';
                  });
               });
            }
         }
         setHeight(entry.contentRect.height);
      });
      observer.observe(el);
      return () => observer.disconnect();
   }, []);

   return (
      <div
         ref={wrapperRef}
         className={`overflow-hidden transition-[height] duration-200 ease-out ${className}`}
         style={{ height }}
      >
         <div ref={contentRef}>{children}</div>
      </div>
   );
}
