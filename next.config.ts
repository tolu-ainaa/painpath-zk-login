import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * The Midnight runtime is WebAssembly with top-level await. Turbopack (the
   * Next.js 16 default) does not handle that combination, so the dev and build
   * scripts pass --webpack and these experiments turn it on.
   *
   * The reference DApp (example-bboard's bboard-ui) needs the equivalent set of
   * Vite plugins — vite-plugin-wasm and vite-plugin-top-level-await — so this
   * is expected, not a workaround for something we got wrong.
   */
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    /*
     * The dev server runs inside WSL while the repo lives on /mnt/d. inotify
     * does not cross that 9p mount, so file changes are invisible to the
     * watcher and new routes 404 until a restart. Poll instead.
     */
    config.watchOptions = {
      ...config.watchOptions,
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    };

    if (!isServer) {
      // The Midnight packages reference Node built-ins on paths the browser
      // never takes. Stub them rather than polyfilling.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
      };
    }

    return config;
  },
};

export default nextConfig;
