'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getSessionEpoch, setAccessTokenForNewSession, subscribeAccessToken } from '@/lib/auth/token-store';
import * as authService from '@/services/auth.service';
import type { UserRole } from '@/services/auth.service';
import { getMe, type Me } from '@/services/user.service';

export class RoleMismatchError extends Error {}

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
   const [bootcampId, setBootcampId] = useState<number | null>(null);
   const [me, setMe] = useState<Me | null>(null);
   const [isInitializing, setIsInitializing] = useState(true);
   const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const logout = useCallback(async (expectedEpoch?: number) => {
      const epoch = expectedEpoch ?? getSessionEpoch();
      try {
         await authService.logout();
      } finally {
         if (getSessionEpoch() === epoch) {
            setAccessTokenForNewSession(null);
            setRole(null);
            setStatus(null);
            setBootcampId(null);
            setMe(null);
         }
      }
   }, []);

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
            await verifyAndSetMe(data.role, epochAtStart);
         })
         .catch(() => {
            // 리프레시 토큰이 없거나 만료됨(또는 role 불일치로 강제 로그아웃됨) → 비로그인 상태
         })
         .finally(() => setIsInitializing(false));

      return () => {
         if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      };
   }, [verifyAndSetMe]);

   const login = useCallback(
      async (emailInput: string, password: string): Promise<LoginResult> => {
         const data = await authService.login({ email: emailInput, password });
         setRole(data.role);
         setStatus(data.status);
         setBootcampId(data.bootcampId);
         setAccessTokenForNewSession(data.accessToken);
         const epochAtLogin = getSessionEpoch();

         const meData = await verifyAndSetMe(data.role, epochAtLogin);

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

   const updateBootcampId = useCallback((id: number) => {
      setBootcampId(id);
   }, []);

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
