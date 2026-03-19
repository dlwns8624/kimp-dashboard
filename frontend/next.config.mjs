/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      // 레거시 URL만 새 지표 페이지로 통합
      {
        source: '/global-indicators',
        destination: '/indicators',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://kimp-backend-2sww.onrender.com/api/:path*',
      },
    ]
  },
};

export default nextConfig;
