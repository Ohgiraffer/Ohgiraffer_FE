'use client';

import { useEffect } from 'react';

// 배경 페이지 스크롤을 잠그는 동안 호출
// overflow:hidden으로 스크롤바가 사라지면 콘텐츠 너비가 스크롤바 폭만큼 늘어나며 덜컹거리므로,
// 스크롤바 폭을 재서 그만큼 html에 padding-right로 보정함
// 이 padding은 sticky 헤더처럼 일반 흐름에 속한 요소의 폭도 줄이기 때문에,
// 헤더에는 같은 폭만큼 반대로 margin-right를 줘서 화면 끝까지 다시 채워줌
export function useScrollLock() {
   useEffect(() => {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;

      const header = document.querySelector('header');
      if (header) header.style.marginRight = `-${scrollbarWidth}px`;

      return () => {
         document.documentElement.style.overflow = '';
         document.documentElement.style.paddingRight = '';
         if (header) header.style.marginRight = '';
      };
   }, []);
}
