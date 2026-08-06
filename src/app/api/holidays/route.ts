import { NextRequest, NextResponse } from 'next/server';
import { getHolidays } from '@/services/holiday.service';

// 캘린더에서 다른 연도로 이동했을 때 클라이언트가 그 연도의 공휴일을 받아오기 위한 엔드포인트
export async function GET(request: NextRequest) {
   const year = Number(request.nextUrl.searchParams.get('year'));
   if (!Number.isInteger(year)) {
      return NextResponse.json({ error: 'year 쿼리 파라미터가 필요합니다' }, { status: 400 });
   }

   const holidays = await getHolidays(year);
   return NextResponse.json(holidays);
}
