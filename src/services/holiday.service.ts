// 우리 백엔드가 아니라 공공데이터포털(data.go.kr) "특일 정보" API를 직접 호출하므로
// @/lib/http의 apiFetch(백엔드 전용, 인증 헤더 자동 부착)를 쓰지 않고 순수 fetch를 사용한다.

const HOLIDAY_API_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

interface HolidayApiItem {
   locdate: number;
   dateName: string;
   isHoliday: 'Y' | 'N';
}

interface HolidayApiResponse {
   response: {
      header: { resultCode: string; resultMsg: string };
      body: {
         items: '' | { item?: HolidayApiItem | HolidayApiItem[] };
      };
   };
}

export interface Holiday {
   date: string; // 'yyyy-MM-dd'
   name: string;
}

function toDateString(locdate: number) {
   const s = String(locdate);
   return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

export async function getHolidays(year: number): Promise<Holiday[]> {
   const serviceKey = process.env.HOLIDAY_API_SERVICE_KEY;
   if (!serviceKey) {
      console.error('HOLIDAY_API_SERVICE_KEY가 설정되지 않았습니다');
      return [];
   }

   // ServiceKey는 이미 URL 인코딩된 값이 .env에 저장돼 있어, encodeURIComponent로
   // 다시 인코딩하면 이중 인코딩되어 인증에 실패한다. 그대로 이어붙인다.
   const url = `${HOLIDAY_API_URL}?solYear=${year}&numOfRows=100&_type=json&ServiceKey=${serviceKey}`;

   try {
      // 외부 API가 응답 지연/행 상태여도 대시보드 렌더링이 무한정 대기하지 않도록 5초 제한을 둔다
      const res = await fetch(url, {
         next: { revalidate: 60 * 60 * 24 },
         signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
         console.error(`공휴일 API 호출 실패: ${res.status}`);
         return [];
      }

      const data: HolidayApiResponse = await res.json();
      if (data.response.header.resultCode !== '00') {
         console.error(`공휴일 API 오류: ${data.response.header.resultMsg}`);
         return [];
      }

      const rawItems = data.response.body.items === '' ? undefined : data.response.body.items.item;
      if (!rawItems) return [];

      const items = Array.isArray(rawItems) ? rawItems : [rawItems];
      return items
         .filter((item) => item.isHoliday === 'Y')
         .map((item) => ({ date: toDateString(item.locdate), name: item.dateName }));
   } catch (error) {
      console.error('공휴일 API 호출 중 오류 발생', error);
      return [];
   }
}
