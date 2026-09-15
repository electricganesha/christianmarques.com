const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://player.vimeo.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https://res.cloudinary.com https://cdn-images-1.medium.com https://*.medium.com https://medium.com https://miro.medium.com https://www.google-analytics.com https://www.googletagmanager.com https://*.ytimg.com https://*.vimeocdn.com;
  media-src 'self' https://res.cloudinary.com blob: data:;
  connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://res.cloudinary.com https://christianmarques-com.vercel.app https://api.rss2json.com;
  frame-src 'self' https://*.vercel.app https://*.web.app https://*.firebaseapp.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vimeo.com https://w.soundcloud.com https://soundcloud.com https://*.soundcloud.com https://bandcamp.com https://*.bandcamp.com https://www.mixcloud.com https://*.mixcloud.com https://open.spotify.com https://*.spotify.com https://codepen.io https://*.codepen.io;
  child-src 'self' blob: https://*.vercel.app https://*.web.app https://*.firebaseapp.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://vimeo.com https://w.soundcloud.com https://soundcloud.com https://*.soundcloud.com https://bandcamp.com https://*.bandcamp.com https://www.mixcloud.com https://*.mixcloud.com https://open.spotify.com https://*.spotify.com https://codepen.io https://*.codepen.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Access-Control-Allow-Origin",
    value: "https://christianmarques.com",
  },
];

module.exports = {
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    loader: "cloudinary",
    path: "https://res.cloudinary.com/dhgkpiqzg/image/upload/",
    domains: ["res.cloudinary.com", "cdn-images-1.medium.com", "medium.com", "miro.medium.com"],
  },
  exportPathMap: async function () {
    return {
      "/": { page: "/" },
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/lab/%20dijkstra-threejs",
        destination: "/lab/dijkstra-threejs/",
        permanent: true,
      },
      {
        source: "/lab/%20dijkstra-threejs/:path*",
        destination: "/lab/dijkstra-threejs/",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.christianmarques.com",
          },
        ],
        destination: "https://christianmarques.com/:path*",
        permanent: true,
      },
    ];
  },
  reactStrictMode: true,
  webpack: (config) => {
    const path = require("path");
    config.output.hashFunction = "sha256";
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    config.resolve.alias = {
      ...config.resolve.alias,
      "three/webgpu": path.resolve(__dirname, "node_modules/three/build/three.webgpu.js"),
      "three/tsl": path.resolve(__dirname, "node_modules/three/build/three.tsl.js"),
      "three/addons": path.resolve(__dirname, "node_modules/three/examples/jsm"),
    };

    return config;
  },
};
