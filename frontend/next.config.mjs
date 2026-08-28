/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add empty turbopack config to avoid build error with webpack config
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // pdfjs-dist needs canvas on server but we use it client-side only
      config.resolve.alias.canvas = false;
    }
    return config;
  },
};

export default nextConfig;
