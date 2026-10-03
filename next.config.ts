import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  async headers() {
    return [
      {
        // The face-tracking WASM runtime + model (see src/components/atelier
        // /try-on/face-tracking.ts) are ~15MB of vendored, content-static
        // assets — nothing under this path changes without a code change
        // (and a new path, if it ever needs to). Long-term immutable
        // caching means only the very first visit ever pays that download;
        // every later try-on open, same device, is served from the
        // browser's own cache with no network round trip at all.
        source: "/mediapipe/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
