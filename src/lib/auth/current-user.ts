import { jwtDecode } from 'jwt-decode';
import { getAccessToken } from './token-store';

// /user/me가 아직 배포되지 않아 사용자 프로필을 조회할 방법이 없다.
// 액세스 토큰의 sub 클레임이 곧 유저 id라서(로그인 응답 JWT 확인됨), 필요한 곳에서만
// 이걸로 "내 id"를 얻는다. /user/me가 배포되면 AuthContext의 값으로 교체.
export function getMyUserId(): number | null {
   const token = getAccessToken();
   if (!token) return null;
   try {
      const { sub } = jwtDecode<{ sub: string }>(token);
      const id = Number(sub);
      return Number.isNaN(id) ? null : id;
   } catch {
      return null;
   }
}
