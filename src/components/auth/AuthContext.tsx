'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getSessionEpoch, setAccessTokenForNewSession, subscribeAccessToken } from '@/lib/auth/token-store';
import * as authService from '@/services/auth.service';
import type { UserRole } from '@/services/auth.service';
import { getMe, type Me } from '@/services/user.service';

// 토큰-계정 정보 불일치로 보고 강제 로그아웃 처리
export class RoleMismatchError extends Error {}

interface AuthContextValue {
   accessToken: string | null;
   role: UserRole | null;
   status: string | null;
   // /user/me 조회 결과
   me: Me | null;
   updateProfileImageUrl: (url: string | null) => void;
   isAuthenticated: boolean;
   // 앱 최초 로드 시 /auth/refresh로 로그인 상태 복구를 시도하는 동안 true
   isInitializing: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [accessToken, setAccessTokenState] = useState<string | null>(null);
   const [role, setRole] = useState<UserRole | null>(null);
   const [status, setStatus] = useState<string | null>(null);
   const [me, setMe] = useState<Me | null>(null);
   const [isInitializing, setIsInitializing] = useState(true);
   const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const logout = useCallback(async () => {
      try {
         await authService.logout();
      } finally {
         setAccessTokenForNewSession(null);
         setRole(null);
         setStatus(null);
         setMe(null);
      }
   }, []);

   // /user/me 조회 실패(네트워크 오류 등) 또는 role 불일치, 어느 쪽이든 로컬 인증 상태를
   // 정리(logout)한 뒤 원래 오류를 그대로 다시 던진다. logout() 자체가 실패해도(예: 이미
   // 만료된 토큰으로 /auth/logout 호출) 로컬 상태는 이미 정리됐으므로 그 오류는 무시하고
   // 호출부에는 항상 원래 원인(getMe 실패 또는 RoleMismatchError)이 전달되게 한다.
   const verifyAndSetMe = useCallback(
      async (expectedRole: UserRole) => {
         let meData: Me;
         try {
            meData = await getMe();
         } catch (err) {
            await logout().catch(() => {});
            throw err;
         }
         if (meData.role !== expectedRole) {
            await logout().catch(() => {});
            throw new RoleMismatchError('로그인 정보와 계정 정보가 일치하지 않습니다.');
         }
         setMe(meData);
         return meData;
      },
      [logout],
   );

   const scheduleRefresh = useCallback(
      (token: string) => {
         if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
         try {
            const { exp } = jwtDecode<{ exp: number }>(token);
            const delay = exp * 1000 - Date.now() - 60_000; // 만료 1분 전 갱신
            // 이 타이머가 실행되는 동안(네트워크 왕복 중) 로그아웃했거나 다른 계정으로 로그인했다면
            // 세션이 바뀐 것이므로, 응답이 오더라도 그 새 세션의 role/status/me를 덮어쓰면 안 된다
            const epochAtSchedule = getSessionEpoch();
            refreshTimerRef.current = setTimeout(async () => {
               let data;
               try {
                  data = await authService.refresh();
               } catch {
                  // 리프레시 토큰 만료 등 — 단, 그 사이 다른 계정으로 로그인했다면 그 세션은 그대로 둔다
                  if (getSessionEpoch() === epochAtSchedule) await logout().catch(() => {});
                  return;
               }
               if (getSessionEpoch() !== epochAtSchedule) return;
               setRole(data.role);
               setStatus(data.status);
               // 실패 시 verifyAndSetMe 내부에서 이미 logout까지 처리하므로 여기선 조용히 종료
               await verifyAndSetMe(data.role).catch(() => {});
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
      authService
         .refresh()
         .then(async (data) => {
            setRole(data.role);
            setStatus(data.status);
            await verifyAndSetMe(data.role);
         })
         .catch(() => {
            // 리프레시 토큰이 없거나 만료됨(또는 role 불일치로 강제 로그아웃됨) → 비로그인 상태
         })
         .finally(() => setIsInitializing(false));

      return () => {
         if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      };
      // verifyAndSetMe는 logout에만 의존, 항상 안정적이라, 최초 1회만 실행돼도 안전
   }, [verifyAndSetMe]);

   const login = useCallback(
      async (emailInput: string, password: string): Promise<LoginResult> => {
         const data = await authService.login({ email: emailInput, password });
         setRole(data.role);
         setStatus(data.status);
         setAccessTokenForNewSession(data.accessToken);

         const meData = await verifyAndSetMe(data.role);

         return {
            role: data.role,
            status: data.status,
            needResetPw: data.need_reset_pw,
            bootcampId: data.bootcampId,
            name: meData.name,
         };
      },
      [verifyAndSetMe],
   );

   const updateProfileImageUrl = useCallback((url: string | null) => {
      setMe((prev) => (prev ? { ...prev, profileImgUrl: url } : prev));
   }, []);

   return (
      <AuthContext.Provider
         value={{
            accessToken,
            role,
            status,
            me,
            updateProfileImageUrl,
            isAuthenticated: !!accessToken,
            isInitializing,
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
