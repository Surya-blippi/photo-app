/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'llzardxjsqypkkslhrbr.supabase.co'
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery'
      },
      {
        protocol: 'https',
        hostname: '*.replicate.delivery'
      }
    ]
  }
};

export default nextConfig;