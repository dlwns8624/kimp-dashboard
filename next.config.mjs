/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
