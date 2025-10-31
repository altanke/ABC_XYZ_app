/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/api/files/images/**", // Путь к твоим изображениям
      },
    ],
  },
};

export default nextConfig;
