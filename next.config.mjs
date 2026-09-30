const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone mode when building inside Docker; default to undefined for native Vercel serverless deployment
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
  transpilePackages: ['three'],
  serverExternalPackages: ['ioredis'],
  reactStrictMode: false, // Prevents duplicate WebGL canvas mounts during dev
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent Clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Strict Referrer Policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Enforce HTTPS
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // Permissions Policy: restrict camera and WebXR spatial tracking strictly to same-origin (self)
          { key: 'Permissions-Policy', value: 'camera=(self), xr-spatial-tracking=(self), microphone=(), geolocation=(), payment=()' },
          // Content Security Policy tailored for Next.js, Three.js (WebGL) and Tesseract.js
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              `connect-src 'self' https://generativelanguage.googleapis.com wss: ${isProd ? '' : 'ws:'}`.trim(),
              "img-src 'self' data: blob: https:",
              "worker-src 'self' blob:",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

