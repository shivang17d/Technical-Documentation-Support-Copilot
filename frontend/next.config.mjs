/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Uploads are proxied to the backend; default is 10MB which truncates larger PDFs.
    // Keep this >= backend MAX_UPLOAD_MB (20MB).
    proxyClientMaxBodySize: "25mb",
    // Embedding large documents can take longer than the default proxy timeout.
    proxyTimeout: 300_000,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
