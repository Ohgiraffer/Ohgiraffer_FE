'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getBootcampSettings } from '@/services/bootcampSettings.service';

export default function DashboardHeader() {
   const [bootcampName, setBootcampName] = useState('');
   const [loadError, setLoadError] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      getBootcampSettings()
         .then((data) => {
            if (!isMounted) return;
            setBootcampName(`${data.orgName} - ${data.proName}`);
         })
         .catch(() => {
            if (!isMounted) return;
            // 백엔드/네트워크가 불안정한 상황으로 보고, 빈 제목 대신 재시도를 유도하는 안내로 대체
            setLoadError('정보를 불러오지 못했습니다. 다시 한번 시도해주세요.');
         });

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <div className="mb-4 ml-1">
         <h1
            className={`text-xl font-extrabold ${bootcampName ? 'text-gray-900' : 'text-gray-400'}`}
         >
            {bootcampName || loadError}
         </h1>
         <p className="mt-1 ml-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays size={14} />
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
         </p>
      </div>
   );
}
