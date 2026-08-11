// 액세스 토큰을 메모리에만 보관하는 모듈 싱글턴
// React 트리 밖(fetch 래퍼)과 안(AuthContext) 양쪽에서 같은 값을 읽고 구독할 수 있어야 해서 Context 대신 여기 둠
type Listener = (token: string | null) => void;

let currentToken: string | null = null;
// 로그인/로그아웃처럼 "계정 자체가 바뀌는" 시점에만 올라간다. 만료 전 자동 갱신(refresh)은 같은
// 계정의 토큰 값만 갈아끼우는 것이라 이 값을 건드리지 않는다 - 로그아웃 직전에 시작된 갱신 요청이
// 응답을 늦게 받아서 방금 로그인한 다른 계정의 토큰/정보를 덮어쓰는 경쟁 상태를 막기 위한 값
let sessionEpoch = 0;
const listeners = new Set<Listener>();

export function getAccessToken() {
   return currentToken;
}

export function setAccessToken(token: string | null) {
   currentToken = token;
   listeners.forEach((listener) => listener(token));
}

// 로그인/로그아웃 등 계정이 바뀌는 시점에서만 호출 - 이 이전에 시작된 refresh 요청의 결과는
// getSessionEpoch()로 낡았음을 확인하고 버려야 한다
export function setAccessTokenForNewSession(token: string | null) {
   sessionEpoch += 1;
   setAccessToken(token);
}

export function getSessionEpoch() {
   return sessionEpoch;
}

export function subscribeAccessToken(listener: Listener) {
   listeners.add(listener);
   return () => {
      listeners.delete(listener);
   };
}
