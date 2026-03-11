/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Keep lint in local workflow, but do not block production deploys.
        ignoreDuringBuilds: true,
    },
    images: {
        domains: ['images.unsplash.com'], // Legacy fallback
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
