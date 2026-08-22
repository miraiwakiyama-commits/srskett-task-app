import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 開発サーバーをlocalhost以外(同一LAN内の他端末、Cloudflare Tunnel等)からアクセスできるようにする
  // Cloudflare Tunnelの一時URLは再起動のたびに変わるため、ワイルドカードで許可しておく
  allowedDevOrigins: ["192.168.11.20", "*.trycloudflare.com"],
};

export default nextConfig;
