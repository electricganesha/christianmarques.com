module.exports = {
  trailingSlash: true,
  images: {
    loader: "cloudinary",
    path: "https://res.cloudinary.com/dhgkpiqzg/image/upload/",
    domains: ["res.cloudinary.com"]
  },
  exportPathMap: async function() {
    return {
      "/": {page: "/"}
    };
  },
  reactStrictMode: true,
  webpack: config => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"]
    });

    return config;
  }
};
