import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/auth/register',
        destination: '/sign-up',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' *.clerk.accounts.dev https://challenges.cloudflare.com *.paddle.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: *.clerk.accounts.dev https://img.clerk.com",
              "font-src 'self'",
              "connect-src 'self' *.clerk.accounts.dev https://clerk-telemetry.com *.upstash.io *.paddle.com https://api.paddle.com",
              "frame-src 'self' https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
