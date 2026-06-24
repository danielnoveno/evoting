/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ponytail: trailingSlash helps cPanel/Apache serve index.html for sub-routes
  trailingSlash: true,
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
            value: "font-src 'self' data: *.gstatic.com; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
