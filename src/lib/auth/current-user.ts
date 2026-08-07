import { jwtDecode } from 'jwt-decode';
import { getAccessToken } from './token-store';

// /user/me는 배포되어 있고 React 컴포넌트에서는 useAuth().me?.userId를 써야 한다.
// 이 함수는 React context에 접근할 수 없는 곳(예: chat.service.ts의 임시 목데이터)에서만
// 보조적으로 쓴다. 액세스 토큰의 sub 클레임이 유저 id인 것은 로그인 응답 JWT로 확인됨.
export function getMyUserId(): number | null {
   const token = getAccessToken();
   if (!token) return null;
   try {
      const { sub } = jwtDecode<{ sub: string }>(token);
      if (!sub || !sub.trim()) return null;
      const id = Number(sub);
      return Number.isInteger(id) ? id : null;
   } catch {
      return null;
   }
}
