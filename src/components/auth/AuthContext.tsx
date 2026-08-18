'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { useQueryClient } from '@tanstack/react-query';
import { getSessionEpoch, setAccessTokenForNewSession, subscribeAccessToken } from '@/lib/auth/token-store';
import { VERIFIED_AUTH_CACHE_COOKIE } from '@/lib/auth/verifiedAuthCookie';
import * as authService from '@/services/auth.service';
import type { UserRole } from '@/services/auth.service';
import { getMe, type Me } from '@/services/user.service';
import { getBootcampBasicInfo } from '@/services/bootcamp.service';

export class RoleMismatchError extends Error {}

export interface InitialAuth {
   role: UserRole;
   status: string;
   bootcampId: number | null;
}

interface AuthContextValue {
   accessToken: string | null;
   role: UserRole | null;
   status: string | null;
   // 아직 온보딩(부트캠프 최초 설정)을 마치지 않은 계정이면 null로 라우트 보호
   bootcampId: number | null;
   me: Me | null;
   updateProfileImageUrl: (url: string | null) => void;
   updateBootcampId: (bootcampId: number) => void;
   isAuthenticated: boolean;
   isInitializing: boolean;
   // 이 세션에 롤이 있는지 한 번이라도 결론이 났는지 - initialAuth로 즉시 시작하거나,
   // 세션 복구용 /auth/refresh가 성공/실패 어느 쪽으로든 끝났을 때 true가 된다
   isSessionVerified: boolean;
   // 최초 로그인 시 강제 비밀번호 변경이 필요한지 - /user/me가 이 값을 내려주므로
   // verifyAndSetMe가 호출될 때마다(로그인/새로고침/토큰 자동갱신) 항상 최신 값으로 복구된다
   needResetPw: boolean;
   // 비밀번호 재설정을 마쳤거나(또는 이미 완료된 계정이라는 걸 확인했을 때) 이 상태를 끈다
   clearNeedResetPw: () => void;
   login: (email: string, password: string) => Promise<LoginResult>;
   logout: () => Promise<void>;
}

interface LoginResult {
   role: UserRole;
   status: string;
   needResetPw: boolean;
   bootcampId: number | null;
   name: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
   children,
   initialAuth = null,
}: {
   children: React.ReactNode;
   // 미들웨어(proxy.ts)가 쿠키로 미리 검증해준 롤 - (user)/layout.tsx에서만 넘어온다.
   // 이게 있으면 클라이언트의 /auth/refresh 왕복을 기다리지 않고 role/status/bootcampId를
   // 즉시 확정 상태로 시작할 수 있다(AuthGuard의 초기 로더/깜빡임 제거가 목적)
   initialAuth?: InitialAuth | null;
}) {
   const queryClient = useQueryClient();
   const pathname = usePathname();
   // 세션 복구 이펙트는 최초 마운트 시점의 경로만 필요하다(ref라 값이 바뀌어도 이 이펙트를 다시
   // 실행시키지 않음 - SPA 네비게이션마다 refresh를 다시 호출하면 안 되기 때문)
   const initialPathnameRef = useRef(pathname);
   const [accessToken, setAccessTokenState] = useState<string | null>(null);
   const [role, setRole] = useState<UserRole | null>(initialAuth?.role ?? null);
   const [status, setStatus] = useState<string | null>(initialAuth?.status ?? null);
   const [bootcampId, setBootcampId] = useState<number | null>(initialAuth?.bootcampId ?? null);
   const [me, setMe] = useState<Me | null>(null);
   const [needResetPw, setNeedResetPw] = useState(false);
   const [isInitializing, setIsInitializing] = useState(true);
   const [isSessionVerified, setIsSessionVerified] = useState(initialAuth != null);
   const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const logout = useCallback(async (expectedEpoch?: number) => {
      const epoch = expectedEpoch ?? getSessionEpoch();
      try {
         await authService.logout();
      } finally {
         // 미들웨어(proxy.ts)가 캐싱해둔 롤 검증 결과 쿠키 - TTL(60초)까지 기다리지 않고
         // 로그아웃 즉시 지워야 그 사이 뒤로가기 등으로 보호된 라우트에 들어가도 이전 세션의
         // 롤로 서버 렌더링되지 않는다
         document.cookie = `${VERIFIED_AUTH_CACHE_COOKIE}=; Max-Age=0; path=/`;
         if (getSessionEpoch() === epoch) {
            setAccessTokenForNewSession(null);
            setRole(null);
            setStatus(null);
            setBootcampId(null);
            setMe(null);
            setNeedResetPw(false);
            // 회원목록/부트캠프설정 등 세션 캐싱된 React Query 데이터가 다음 로그인 계정에
            // 그대로 노출되지 않도록 로그아웃 시 캐시를 전부 비운다
            queryClient.clear();
         }
      }
   }, [queryClient]);

   // 대시보드 헤더(DashboardHeader)의 부트캠프 이름이 LCP 요소인데, 그 컴포넌트가 마운트된 뒤
   // 직접 조회를 시작하면 하이드레이션+API 왕복만큼 렌더링이 늦어진다. 세션이 확정되는 시점에
   // 미리 같은 쿼리 키로 캐시를 채워두면, 실제 마운트 시점엔 캐시 히트라 바로 그려진다.
   // 세션 내내 안 바뀌는 데이터라 실패해도 조용히 무시하고, DashboardHeader의 useQuery가
   // 마운트 시 원래대로 재시도한다
   const prefetchBootcampBasicInfo = useCallback(() => {
      queryClient
         .prefetchQuery({
            queryKey: ['bootcampBasicInfo'],
            queryFn: getBootcampBasicInfo,
            staleTime: Infinity,
         })
         .catch(() => {});
   }, [queryClient]);

   const verifyAndSetMe = useCallback(
      async (expectedRole: UserRole, expectedEpoch: number) => {
         let meData: Me;
         try {
            meData = await getMe();
         } catch (err) {
            if (getSessionEpoch() === expectedEpoch) await logout(expectedEpoch).catch(() => {});
            throw err;
         }
         if (getSessionEpoch() !== expectedEpoch) {
            throw new Error('세션이 변경되어 프로필 조회 결과를 적용하지 않았습니다.');
         }
         if (meData.role !== expectedRole) {
            await logout(expectedEpoch).catch(() => {});
            throw new RoleMismatchError('로그인 정보와 계정 정보가 일치하지 않습니다.');
         }
         setMe(meData);
         setBootcampId(meData.bootcampId);
         setNeedResetPw(meData.needResetPw);
         return meData;
      },
      [logout],
   );

   const scheduleRefresh = useCallback(
      (token: string) => {
         if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
         try {
            const { exp } = jwtDecode<{ exp: number }>(token);
            const delay = exp * 1000 - Date.now() - 60_000;
            const epochAtSchedule = getSessionEpoch();
            refreshTimerRef.current = setTimeout(async () => {
               let data;
               try {
                  data = await authService.refresh();
               } catch {
                  if (getSessionEpoch() === epochAtSchedule) await logout(epochAtSchedule).catch(() => {});
                  return;
               }
               if (getSessionEpoch() !== epochAtSchedule) return;
               setRole(data.role);
               setStatus(data.status);
               setBootcampId(data.bootcampId);
               await verifyAndSetMe(data.role, epochAtSchedule).catch(() => {});
            }, Math.max(delay, 0));
         } catch {
            // 토큰 형식이 이상할 때, 타이머 없이 401 재시도
         }
      },
      [verifyAndSetMe, logout],
   );

   useEffect(() => {
      const unsubscribe = subscribeAccessToken((token) => {
         setAccessTokenState(token);
         if (token) {
            scheduleRefresh(token);
         } else if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
         }
      });
      return unsubscribe;
   }, [scheduleRefresh]);

   useEffect(() => {
      const epochAtStart = getSessionEpoch();
      authService
         .refresh()
         .then(async (data) => {
            if (getSessionEpoch() !== epochAtStart) return;
            setRole(data.role);
            setStatus(data.status);
            setBootcampId(data.bootcampId);
            // Menubar의 호버 프리페치는 다른 페이지에서 대시보드로 넘어갈 때만 동작해서,
            // 로그인 직후 대시보드로 처음 진입하는 경우(호버할 기회 자체가 없음)는 못 잡는다.
            // 이 경로만 보완하면 되므로 대시보드를 새로고침/최초 진입할 때만 실행한다 - 다른
            // 페이지에서까지 실행하면 그 페이지의 진짜 필요한 요청과 네트워크를 나눠 쓰게 된다
            if (initialPathnameRef.current === '/') prefetchBootcampBasicInfo();
            await verifyAndSetMe(data.role, epochAtStart);
         })
         .catch(() => {
            // 리프레시 토큰이 없거나 만료됨(또는 role 불일치로 강제 로그아웃됨) → 비로그인 상태.
            // initialAuth로 낙관적으로 세팅해뒀던 role 등이 남아있으면(미들웨어 검증 직후 짧은
            // 사이에 세션이 끊긴 경우) 지워야 한다 - 안 지우면 accessToken은 끝내 안 채워지는데
            // role만 남아 AuthGuard가 로그인 상태로 착각하고 보호된 화면을 계속 보여주게 된다
            if (getSessionEpoch() === epochAtStart) {
               setRole(null);
               setStatus(null);
               setBootcampId(null);
            }
         })
         .finally(() => {
            setIsInitializing(false);
            // 성공/실패 어느 쪽이든 여기서 true로 세팅해야 한다 - then()에만 넣으면 진짜
            // 비로그인 사용자는 실패 케이스라 isSessionVerified가 영영 false로 남아
            // AuthGuard의 /login 리다이렉트가 걸리지 않는다
            setIsSessionVerified(true);
         });

      return () => {
         if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      };
   }, [verifyAndSetMe, prefetchBootcampBasicInfo]);

   const login = useCallback(
      async (emailInput: string, password: string): Promise<LoginResult> => {
         const data = await authService.login({ email: emailInput, password });
         // 같은 브라우저 탭에서 다른 계정으로 로그인하는 경우, 이전 계정의 회원목록/부트캠프설정 등
         // 캐시된 응답이 새 계정 화면에 그대로 노출되지 않도록 새 세션을 만들기 전에 캐시를 비운다
         queryClient.clear();
         setRole(data.role);
         setStatus(data.status);
         setBootcampId(data.bootcampId);
         setNeedResetPw(data.need_reset_pw);
         setAccessTokenForNewSession(data.accessToken);
         const epochAtLogin = getSessionEpoch();
         prefetchBootcampBasicInfo();

         const meData = await verifyAndSetMe(data.role, epochAtLogin);

         return {
            role: data.role,
            status: data.status,
            needResetPw: data.need_reset_pw,
            bootcampId: data.bootcampId,
            name: meData.name,
         };
      },
      [verifyAndSetMe, queryClient, prefetchBootcampBasicInfo],
   );

   const updateProfileImageUrl = useCallback((url: string | null) => {
      setMe((prev) => (prev ? { ...prev, profileImgUrl: url } : prev));
   }, []);

   const updateBootcampId = useCallback((id: number) => {
      setBootcampId(id);
   }, []);

   const clearNeedResetPw = useCallback(() => setNeedResetPw(false), []);

   return (
      <AuthContext.Provider
         value={{
            accessToken,
            role,
            status,
            bootcampId,
            me,
            updateProfileImageUrl,
            updateBootcampId,
            isAuthenticated: !!accessToken,
            isInitializing,
            isSessionVerified,
            needResetPw,
            clearNeedResetPw,
            login,
            logout,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
}

export function useAuth() {
   const ctx = useContext(AuthContext);
   if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
   return ctx;
}
