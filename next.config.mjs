/** @type {import('next').NextConfig} */
const nextConfig = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  webpack: (config, { dev }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
  reactStrictMode: false,
  async headers() {
    // Only apply WASM headers in development
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
        {
          source: '/:path*.wasm',
          headers: [
            {
              key: 'Content-Type',
              value: 'application/wasm',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig; 