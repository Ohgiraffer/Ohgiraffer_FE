// 액세스 토큰을 메모리에만 보관하는 모듈 싱글턴
// React 트리 밖(fetch 래퍼)과 안(AuthContext) 양쪽에서 같은 값을 읽고 구독할 수 있어야 해서 Context 대신 여기 둠
type Listener = (token: string | null) => void;

let currentToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken() {
   return currentToken;
}

export function setAccessToken(token: string | null) {
   currentToken = token;
   listeners.forEach((listener) => listener(token));
}

export function subscribeAccessToken(listener: Listener) {
   listeners.add(listener);
   return () => {
      listeners.delete(listener);
   };
}
