'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { setAccessToken, subscribeAccessToken } from '@/lib/auth/token-store';
import * as authService from '@/services/auth.service';
import type { UserRole } from '@/services/auth.service';

interface AuthContextValue {
   accessToken: string | null;
   role: UserRole | null;
   status: string | null;
   // 로그인 응답엔 이름/이메일이 없어, 로그인 시 입력한 이메일을 화면 표시용으로만 들고 있는다.
   // 새로고침으로 세션이 복구된 경우엔 비어 있다.
   email: string | null;
   isAuthenticated: boolean;
   // 앱 최초 로드 시 /auth/refresh로 로그인 상태 복구를 시도하는 동안 true
   isInitializing: boolean;
   login: (email: string, password: string) => Promise<LoginResult>;
   logout: () => Promise<void>;
}

interface LoginResult {
   role: UserRole;
   status: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [accessToken, setAccessTokenState] = useState<string | null>(null);
   const [role, setRole] = useState<UserRole | null>(null);
   const [status, setStatus] = useState<string | null>(null);
   const [email, setEmail] = useState<string | null>(null);
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

   useEffect(() => {
      authService
         .refresh()
         .catch(() => {
            // 리프레시 토큰이 없거나 만료됨 → 비로그인 상태
         })
         .finally(() => setIsInitializing(false));

      return () => {
         if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      };
   }, []);

   const login = useCallback(async (emailInput: string, password: string) => {
      const data = await authService.login({ email: emailInput, password });
      setRole(data.role);
      setStatus(data.status);
      setEmail(emailInput);
      setAccessToken(data.accessToken);
      return { role: data.role, status: data.status };
   }, []);

   const logout = useCallback(async () => {
      try {
         await authService.logout();
      } finally {
         setAccessToken(null);
         setRole(null);
         setStatus(null);
         setEmail(null);
      }
   }, []);

   return (
      <AuthContext.Provider
         value={{
            accessToken,
            role,
            status,
            email,
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
