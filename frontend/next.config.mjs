/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "font-src 'self' *.vercel.com *.gstatic.com vercel.live k2mkucxia43oc7fa.public.blob.vercel-storage.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
