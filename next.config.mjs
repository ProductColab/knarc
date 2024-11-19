/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Keep CORS headers for development only
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin',
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'require-corp',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig; 