/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/indicators',
        destination: '/market-data',
        permanent: true,
      },
      {
        source: '/global-indicators',
        destination: '/market-data',
        permanent: true,
      },
    ]
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
