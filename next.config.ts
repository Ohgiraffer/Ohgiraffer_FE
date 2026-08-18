import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

const nextConfig: NextConfig = {
   /* config options here */
   output: 'standalone',
   poweredByHeader: false,
   experimental: {
      authInterrupts: true,
   },
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: 'be.campflow.co.kr',
            pathname: '/**',
         },
         {
            protocol: 'https',
            hostname: 'ohgiraffer-media.s3.ap-northeast-2.amazonaws.com',
            pathname: '/**',
         },
      ],
   },
   async headers() {
      return [
         {
            source: '/:path*',
            headers: [
               { key: 'X-Frame-Options', value: 'DENY' },
               { key: 'X-Content-Type-Options', value: 'nosniff' },
               { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
               {
                  key: 'Content-Security-Policy',
                  // frame-src만 좁게 지정 - 다른 리소스 타입(script/style/img/connect 등)은 이
                  // 지시어와 무관하게 그대로 전부 허용된다. S3는 SubmissionPreviewModal.tsx의
                  // PDF 미리보기 iframe, docs.google.com은 StudentSurveyResponseClient.tsx의
                  // 설문 응답 iframe(responseUrl)이 이미 쓰고 있어서 같이 넣지 않으면 그 기능이
                  // 깨진다
                  value:
                     "frame-src 'self' https://ohgiraffer-media.s3.ap-northeast-2.amazonaws.com https://docs.google.com;",
               },
            ],
         },
      ];
   },
};


// 번들 분석기 설정
const bundleAnalyzer = withBundleAnalyzer({
   enabled: process.env.ANALYZE === 'true',
   openAnalyzer: true,
});

export default bundleAnalyzer(nextConfig);
