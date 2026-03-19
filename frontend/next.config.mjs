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
};

export default nextConfig;
