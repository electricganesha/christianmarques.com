const contentDates = require("./utils/contentDates.json");

const SECTION_UPDATES = {
  "/": "2026-09-05T18:00:00.000Z",
  "/about": "2026-09-05T18:00:00.000Z",
  "/projects": "2026-03-16T00:00:00.000Z",
  "/lab": "2026-08-08T23:00:00.000Z",
  "/music": "2026-07-27T23:00:00.000Z",
  "/writing": "2021-08-31T23:00:00.000Z",
  "/press": "2019-05-06T23:00:00.000Z",
  "/blog": "2026-08-01T00:00:00.000Z",
  "/photo": "2021-06-16T23:00:00.000Z",
};

function getTruthfulDate(path) {
  const clean = path.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "") || "/";

  if (SECTION_UPDATES[clean]) {
    return SECTION_UPDATES[clean];
  }

  const parts = clean.split("/").filter(Boolean);
  if (parts.length >= 2) {
    const [section, rawSlug] = parts;
    const slug = decodeURIComponent(rawSlug).trim();
    const mapKey =
      section === "projects" ? "software" : section === "writing" ? "poetry" : section;
    if (contentDates[mapKey] && contentDates[mapKey][slug]) {
      return contentDates[mapKey][slug];
    }
  }

  return "2026-01-01T00:00:00.000Z";
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://christianmarques.com",
  generateRobotsTxt: true,
  autoLastmod: false,
  transform: async (config, url) => {
    let cleanUrl = url.replace(/\/(\s+|%20)+dijkstra-threejs/, "/dijkstra-threejs");
    const lastmod = getTruthfulDate(cleanUrl);
    return {
      loc: cleanUrl,
      lastmod,
      changefreq: null,
      priority: null,
    };
  },
};
