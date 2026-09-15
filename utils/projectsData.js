import { formatTag } from "./tagFormatter.js";

/**
 * Curated high-impact two-sentence summaries for cards.
 * Prevents injecting heavy raw multi-paragraph HTML descriptions into the DOM.
 */
export const CURATED_PROJECT_SUMMARIES = {
  timewavezero:
    "An interactive 3D mathematical visualization exploring Terence McKenna's Novelty Theory and the I Ching. Built with Three.js, WebGL, and custom GLSL shaders.",
  cleromancer:
    "An algorithmic interpretation of the 3,000-year-old I Ching divination system. Features generative SVG artwork, coin casting simulations, and philosophical inquiry.",
  promaton:
    "Senior software engineering delivering clinical-grade 3D WebGL visualizations and cloud diagnostic pipelines for maxillofacial healthcare. Built with Three.js and micro-frontends.",
  hamster:
    "An IoT smart monitoring ecosystem tracking behavioral patterns and wheel activity for a pet hamster. Combines Raspberry Pi sensors, Python telemetry, and real-time dashboards.",
  "chronic-poetics":
    "An interactive generative poetry system exploring algorithmic language structures and digital lyricism through procedural text transformations.",
  ripair:
    "A physics-based arcade adventure game developed with Unity and C#, challenging players with high-stakes aerial mechanics.",
  naadir:
    "A research project at FCT/FCUL developing an innovative 3D model perspective visualizer. Implemented in C++ and Qt, showcased at Lisbon's Museum of Natural History and Science.",
  "mover-a-montanha":
    "A Portuguese civic platform and political consciousness publication. Features an editorial back-office and contributor management tools built for public engagement.",
  "vodafone-vr":
    "The first-ever virtual reality experience developed for Vodafone Portugal, taking users on an immersive cyberspace voyage. Built for Samsung GearVR and Oculus Rift with Unity3D.",
  push:
    "Co-founded digital interactive studio delivering high-performance 3D web experiences and WebGL applications. Led technology and full-stack software development.",
  hipponaut:
    "A cute space shooter video game created during Global Game Jam 2017. Developed collaboratively with artists and engineers using Unity3D and C#.",
  trouva:
    "Full-stack engineering for a leading independent boutique e-commerce marketplace. Scaled frontend React architecture, search systems, and checkout services.",
  baetes:
    "Interactive 3D stage installation and dynamic lighting control system designed for live performance environments.",
  amadeus:
    "Airline reservation and open back-end architecture development handling high-throughput global travel transactions.",
  "marsh-mclennan":
    "Early infrastructure, server maintenance, and enterprise IT systems support for global corporate offices.",
};

/**
 * Strips HTML tags and cleanly extracts up to 2 concise sentences (~140-180 characters max).
 */
export function extractShortSummary(htmlOrText, maxSentences = 2) {
  if (!htmlOrText || typeof htmlOrText !== "string") return "";

  // Strip HTML tags and normalize whitespace
  const text = htmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  // Extract sentences
  const sentenceMatches = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  if (sentenceMatches && sentenceMatches.length > 0) {
    const selected = sentenceMatches.slice(0, maxSentences).join("").trim();
    if (selected.length <= 220) {
      return selected;
    }
  }

  // Fallback: truncate on word boundary around 160 characters
  if (text.length <= 160) return text;
  const truncated = text.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated).trim() + "...";
}

/**
 * Returns a dedicated 2-sentence card summary for any project.
 */
export function getProjectCardSummary(project) {
  if (!project) return "";
  if (project.summary && typeof project.summary === "string" && project.summary.trim()) {
    return project.summary.trim();
  }
  const slug = (project.slug || "").toLowerCase();
  if (CURATED_PROJECT_SUMMARIES[slug]) {
    return CURATED_PROJECT_SUMMARIES[slug];
  }
  return extractShortSummary(project.description || project.text || "");
}

export function sanitizeHtmlString(str, slug = "") {
  if (!str || typeof str !== "string") return str;

  let cleaned = str
    // Fix all malformed href attributes with curly quotes, missing quotes, or missing protocols
    .replace(/href=["“\u201c'‘]([^\s"“”\u201c\u201d'’>]+)(?:["“”\u201c\u201d'’]|(?=>))/gi, (match, url) => {
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith("www.")) {
        cleanUrl = `https://${cleanUrl}`;
      } else if (cleanUrl === "vodafone.pt/" || cleanUrl.startsWith("vodafone.pt")) {
        cleanUrl = `https://${cleanUrl}`;
      } else if (cleanUrl === "cycloid.pt" || cleanUrl.startsWith("cycloid.pt")) {
        cleanUrl = `https://${cleanUrl}`;
      }
      return `href="${cleanUrl}" target="_blank" rel="noopener noreferrer"`;
    })
    // Fix all malformed src attributes with curly quotes
    .replace(/src=["“\u201c'‘]([^\s"“”\u201c\u201d'’>]+)(?:["“”\u201c\u201d'’]|(?=>))/gi, 'src="$1"')
    // Replace any remaining curly quotes used in attributes
    .replace(/=["“\u201c]([^"“”\u201c\u201d]+)["”\u201d]/g, '="$1"')
    // Fix known typos across projects
    .replace(/multinacional/gi, "multinational")
    .replace(/\bOverhall\b/g, "Overhaul")
    .replace(/\boverhall\b/g, "overhaul")
    .replace(/\bcarreer\b/gi, "career")
    .replace(/\bsometing\b/gi, "something")
    .replace(/\bparticipator\b/gi, "participant")
    .replace(/\bRessurection\b/g, "Resurrection")
    .replace(/\bressurection\b/g, "resurrection");

  // Fix "lightning" to "lighting" specifically in 3D/stage/production contexts like Baetes
  if (slug === "baetes" || cleaned.includes("stage") || cleaned.includes("show")) {
    cleaned = cleaned.replace(/\blightning\b/gi, "lighting");
  }

  return cleaned;
}

export function sanitizeProject(project) {
  if (!project) return project;

  const slug = (project.slug || "").toLowerCase();
  const existingCaseStudy = project.caseStudy || {};

  const caseStudy =
    project.caseStudy ||
    project.theChallenge ||
    project.myRole ||
    project.keyOutcomes ||
    project.outcomeAndLearning
      ? {
          theChallenge: project.theChallenge || existingCaseStudy.theChallenge || null,
          myRole: project.myRole || existingCaseStudy.myRole || null,
          architecture: project.architecture || existingCaseStudy.architecture || null,
          keyOutcomes: project.keyOutcomes || existingCaseStudy.keyOutcomes || null,
          metrics: project.metrics || existingCaseStudy.metrics || null,
          outcomeAndLearning:
            existingCaseStudy.outcomeAndLearning ||
            existingCaseStudy.keyOutcomes ||
            project.outcomeAndLearning ||
            null,
          ...existingCaseStudy,
        }
      : null;

  const sanitized = {
    ...project,
    name: sanitizeHtmlString(project.name || "", slug),
    description: sanitizeHtmlString(project.description || "", slug),
    text: sanitizeHtmlString(project.text || "", slug),
    summary: getProjectCardSummary(project),
    tags: (project.tags || []).map((t) => formatTag(t)),
    caseStudy,
  };

  if (sanitized.links && Array.isArray(sanitized.links)) {
    sanitized.links = sanitized.links.map((link) => {
      let url = link.url || "";
      // Fix curly quotes in link URLs
      url = url.replace(/^[“"\u201c']+|[”"\u201d']+$/g, "").trim();
      if (url.startsWith("www.")) {
        url = `https://${url}`;
      }
      return {
        ...link,
        url,
      };
    });
  }

  return sanitized;
}

export function sanitizeProjectsList(projects) {
  if (!projects || !Array.isArray(projects)) return [];
  return projects.map((p) => sanitizeProject(p));
}

/**
 * Curated project slugs by tier
 */
export const CURATED_TIERS = {
  featured: ["timewavezero", "cleromancer", "promaton", "hamster", "chronic-poetics", "ripair"],
  professional: [
    "trouva",
    "baetes",
    "push",
    "amadeus",
    "naadir",
    "marsh-mclennan",
    "ibo",
    "cycloid",
  ],
  experiments: [
    "nerdscavenge",
    "meeple-night",
    "sjgmusic",
    "hypseus",
    "nespera",
    "liberdade-quiz",
    "xiripiti",
    "keep-quiet",
    "bits-bitaites",
    "spy-or-die",
    "awp",
    "vodafone-vr",
  ],
  archive: [
    "hipponaut",
    "mover-a-montanha",
    "panic-plane",
    "super-meat-boy",
  ],
};

/**
 * High-level category filters mapping
 */
export const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "3d", label: "3D & Graphics" },
  { id: "ai", label: "AI & Tools" },
  { id: "creative", label: "Creative Coding" },
  { id: "web", label: "Web Applications" },
  { id: "games", label: "Games & Interactive" },
];

/**
 * Tests whether a project matches a high-level category
 */
export function matchesCategory(project, categoryId) {
  if (!project || categoryId === "all") return true;

  // 1. Check direct database categories field (populated from Firestore)
  if (Array.isArray(project.categories) && project.categories.length > 0) {
    return project.categories
      .map((c) => (typeof c === "string" ? c.toLowerCase() : ""))
      .includes(categoryId.toLowerCase());
  }

  // 2. Fallback to tag & metadata inference if categories field is absent
  const slug = (project.slug || "").toLowerCase();
  const name = (project.name || "").toLowerCase();
  const tags = (project.tags || []).map((t) => t.toLowerCase());
  const category = (project.category || "").toLowerCase();

  switch (categoryId) {
    case "3d":
      return (
        slug === "timewavezero" ||
        slug === "promaton" ||
        slug === "baetes" ||
        slug === "vodafone-vr" ||
        tags.some((t) => ["3d", "three.js", "webgl", "opengl", "vr", "glsl", "shader"].includes(t)) ||
        category.includes("3d")
      );
    case "ai":
      return (
        slug === "promaton" ||
        slug === "cleromancer" ||
        slug === "hamster" ||
        tags.some((t) => ["ai", "machine learning", "computer vision", "algorithm", "iot"].includes(t))
      );
    case "creative":
      return (
        slug === "timewavezero" ||
        slug === "cleromancer" ||
        slug === "chronic-poetics" ||
        slug === "sjgmusic" ||
        slug === "hypseus" ||
        tags.some((t) => ["creative coding", "interactive", "generative", "poetry", "art", "music"].includes(t))
      );
    case "web":
      return (
        slug === "cleromancer" ||
        slug === "timewavezero" ||
        slug === "promaton" ||
        slug === "trouva" ||
        slug === "nerdscavenge" ||
        slug === "meeple-night" ||
        slug === "push" ||
        tags.some((t) => ["react", "next.js", "web", "frontend", "full-stack", "typescript", "javascript"].includes(t))
      );
    case "games":
      return (
        slug === "ripair" ||
        slug === "spy-or-die" ||
        slug === "awp" ||
        slug === "panic-plane" ||
        slug === "hipponaut" ||
        slug === "liberdade-quiz" ||
        tags.some((t) => ["game", "games", "unity", "unreal", "game design", "arcade"].includes(t))
      );
    default:
      return true;
  }
}

/**
 * Extracts a numeric timestamp in milliseconds from a project's date field.
 * Supports Firestore Timestamp objects (_seconds / seconds), Date objects, or string dates.
 */
export function getProjectTimestamp(p) {
  if (!p || !p.date) return 0;
  if (typeof p.date === "object") {
    if ("_seconds" in p.date) return p.date._seconds * 1000;
    if ("seconds" in p.date) return p.date.seconds * 1000;
    if (p.date instanceof Date) return p.date.getTime();
  }
  if (typeof p.date === "number") return p.date;
  if (typeof p.date === "string") {
    const parsed = Date.parse(p.date);
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

/**
 * Sort comparator to order projects chronologically by date descending (newest first).
 */
export function sortProjectsByDateDesc(a, b) {
  const timeA = getProjectTimestamp(a);
  const timeB = getProjectTimestamp(b);
  if (timeA !== timeB) {
    return timeB - timeA;
  }
  return (a.name || "").localeCompare(b.name || "");
}

/**
 * Organizes a list of sanitized projects into curated sections.
 * Reads directly from database fields (project.section, project.sections, project.featured),
 * and orders projects within each section chronologically by date descending (newest first).
 */
export function curateProjects(projects) {
  const sanitized = sanitizeProjectsList(projects);

  const featured = [];
  const experiments = [];
  const professional = [];
  const archive = [];

  sanitized.forEach((p) => {
    const sections = new Set();

    // 1. Check array field: project.sections (e.g. ["featured", "professional"])
    if (Array.isArray(p.sections)) {
      p.sections.forEach((s) => {
        if (typeof s === "string") sections.add(s.toLowerCase());
      });
    }

    // 2. Check string field: project.section (e.g. "featured", "experiments", "professional", "archive")
    if (typeof p.section === "string" && p.section.trim()) {
      sections.add(p.section.trim().toLowerCase());
    }

    // 3. Check boolean flag: project.featured === true
    if (p.featured === true) {
      sections.add("featured");
    }

    // 4. Fallback to code CURATED_TIERS if no DB section is specified
    if (sections.size === 0) {
      const slug = p.slug;
      let matched = false;
      if (CURATED_TIERS.featured.includes(slug)) {
        sections.add("featured");
        matched = true;
      }
      if (CURATED_TIERS.experiments.includes(slug)) {
        sections.add("experiments");
        matched = true;
      }
      if (CURATED_TIERS.professional.includes(slug)) {
        sections.add("professional");
        matched = true;
      }
      if (CURATED_TIERS.archive.includes(slug)) {
        sections.add("archive");
        matched = true;
      }
      if (!matched) {
        if (
          (p.date && String(p.date).includes("201")) ||
          (p.date && p.date._seconds && p.date._seconds < 1577836800)
        ) {
          sections.add("archive");
        } else {
          sections.add("experiments");
        }
      }
    }

    // Distribute project into exactly one editorial section (no duplicates across sections)
    if (sections.has("featured")) {
      featured.push(p);
    } else if (sections.has("professional")) {
      professional.push(p);
    } else if (sections.has("experiments")) {
      experiments.push(p);
    } else if (sections.has("archive")) {
      archive.push(p);
    } else {
      experiments.push(p);
    }
  });

  // Sort within each section chronologically by date descending (newest first)
  featured.sort(sortProjectsByDateDesc);
  experiments.sort(sortProjectsByDateDesc);
  professional.sort(sortProjectsByDateDesc);
  archive.sort(sortProjectsByDateDesc);

  return {
    all: sanitized.sort(sortProjectsByDateDesc),
    featured,
    experiments,
    professional,
    archive,
  };
}
