// proxy.ts(서버, 캐시 쿠키 설정/조회)와 AuthContext.tsx(클라이언트, 로그아웃 시 정리)가
// 같은 쿠키 이름을 참조해야 해서 상수로 분리
export const VERIFIED_AUTH_CACHE_COOKIE = 'verifiedAuthCache';
