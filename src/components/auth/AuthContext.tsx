'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAccessToken, subscribeAccessToken } from '@/lib/auth/token-store';
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

   const scheduleRefresh = useCallback((token: string) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      try {
         const { exp } = jwtDecode<{ exp: number }>(token);
         const delay = exp * 1000 - Date.now() - 60_000; // 만료 1분 전 갱신
         refreshTimerRef.current = setTimeout(() => {
            authService.refresh().catch(() => {
               setRole(null);
               setStatus(null);
            });
         }, Math.max(delay, 0));
      } catch {
         // 토큰 형식이 이상할 때, 타이머 없이 401 재시도
      }
   }, []);

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

   const logout = useCallback(async () => {
      try {
         await authService.logout();
      } finally {
         setAccessToken(null);
         setRole(null);
         setStatus(null);
         setMe(null);
      }
   }, []);

   // role이 서로 다르면 강제 로그아웃한다.
   const verifyAndSetMe = useCallback(
      async (expectedRole: UserRole) => {
         const meData = await getMe();
         if (meData.role !== expectedRole) {
            await logout();
            throw new RoleMismatchError('로그인 정보와 계정 정보가 일치하지 않습니다.');
         }
         setMe(meData);
         return meData;
      },
      [logout],
   );

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
         setAccessToken(data.accessToken);

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
