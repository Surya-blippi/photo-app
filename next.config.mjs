/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'llzardxjsqypkkslhrbr.supabase.co'
    }]
  }
}

export default nextConfig;