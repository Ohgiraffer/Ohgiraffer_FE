import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
   /* config options here */
   output: 'standalone',
   poweredByHeader: false,
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: 'be.campflow.co.kr',
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
            ],
         },
      ];
   },
};

export default nextConfig;
