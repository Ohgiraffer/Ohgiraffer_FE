'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { getConsultationDetail, type ConsultationDetail } from '@/services/counseling.service';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 상담 상세 페이지 - 조회 + "담당 운영진 본인인지" 판단
export function useCounselingDetail(consultationId: number) {
   const router = useRouter();
   const { me } = useAuth();

   const [detail, setDetail] = useState<ConsultationDetail | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);

   useEffect(() => {
      if (!Number.isInteger(consultationId)) return;
      let isMounted = true;

      getConsultationDetail(consultationId)
         .then((data) => {
            if (isMounted) setDetail(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            if (err instanceof ApiError && err.status === 403) {
               toast.error(getApiErrorMessage(err, '상담 조회 권한이 없습니다.'));
               router.replace('/counseling');
               return;
            }
            setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [consultationId, router]);

   // 담당 운영진 본인인지 - 상세 응답에 담당자 id가 없어서 이름으로 비교한다
   // (동명이인이면 어긋날 수 있는 한계가 있음, 백엔드에서 id를 내려주면 그걸로 바꿔야 함)
   const isMyConsultation = Boolean(me && detail && me.name === detail.counselorName);

   return { detail, setDetail, isLoading, hasError, isMyConsultation };
}
