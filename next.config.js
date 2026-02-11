/** @type {import('next').NextConfig} */
const nextConfig = {
  // PERF: Strict mode helps catch bugs early; enabled in dev, transparent in prod
  reactStrictMode: true,

  // PERF: Image optimization with AVIF/WebP
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // PERF: SWC-based minification (faster than Terser)
  swcMinify: true,

  // PERF: Gzip compression for all responses
  compress: true,

  // PERF: Enable experimental optimizations
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'firebase', 'firebase/firestore', 'firebase/auth'],
  },

  // PERF: Optimize webpack for faster builds and smaller bundles
  webpack: (config, { isServer }) => {
    // Optimize for production builds
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },

  // PERF: Output standalone for better deployment performance
  output: 'standalone',

  // SECURITY + PERF: Comprehensive headers
  async headers() {
    return [
      {
        // SECURITY: Apply security headers to all routes
        source: '/(.*)',
        headers: [
          // SECURITY: Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // SECURITY: Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // SECURITY: XSS protection (legacy browser fallback)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // SECURITY: Control referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // SECURITY: Enforce HTTPS (HSTS) — 1 year, include subdomains
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // SECURITY: Permissions Policy — restrict dangerous browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // SECURITY: Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://firestore.googleapis.com https://cloudflareinsights.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
              "frame-src 'self' https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // PERF: Long-term cache for static data files
        source: '/data/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // PERF: Cache static assets (images, fonts) for 1 year
        source: '/:path*.(png|jpg|jpeg|gif|svg|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
