/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Content-Security-Policy',
            value: "font-src 'self' data: *.vercel.com *.gstatic.com vercel.live k2mkucxia43oc7fa.public.blob.vercel-storage.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
