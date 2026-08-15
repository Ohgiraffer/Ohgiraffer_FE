'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ApiError } from '@/lib/http';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { getBootcampBasicInfo } from '@/services/bootcamp.service';

export default function DashboardHeader() {
   // 세션 내내 안 바뀌는 순수 참조 데이터라, 기본 5분 대신 무한 staleTime을 준다
   const { data, error, isLoading } = useQuery({
      queryKey: ['bootcampBasicInfo'],
      queryFn: getBootcampBasicInfo,
      staleTime: Infinity,
   });
   const bootcampName = data ? `${data.orgName} - ${data.proName}` : '';
   const loadError = error
      ? error instanceof ApiError
         ? error.message
         : '정보를 불러오지 못했습니다. 다시 한번 시도해주세요.'
      : null;

   if (isLoading) {
      return (
         <div className="mb-4 ml-1">
            <Skeleton width={180} height={26} className="rounded-md" />
            <div className="mt-2 ml-1">
               <Skeleton width={160} height={16} className="rounded-xs" />
            </div>
         </div>
      );
   }

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
