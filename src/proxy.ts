import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 로그인 기능이 아직 없어서 지금은 별도 인증/권한 체크 없이 그대로 통과시킨다.
// 로그인 기능이 붙으면, 여기서 인증 토큰을 확인해 비로그인 사용자를 /login으로,
// 권한이 맞지 않는 사용자를 적절한 경로로 리다이렉트하는 로직을 추가한다.
export function proxy(_request: NextRequest) {
   return NextResponse.next();
}
