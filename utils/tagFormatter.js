/**
 * Dictionary and utility for formatting and normalizing tags
 * across project cards, blog cards, and case studies.
 */

const EXACT_TAG_MAP = {
  // Database / Backend
  "postgressql": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "oracle db": "Oracle DB",
  "mongodb": "MongoDB",
  "node.js": "Node.js",
  "firebase": "Firebase",
  "back-end": "Back-End",
  "stripe": "Stripe",

  // Graphics & 3D
  "webgpu": "WebGPU",
  "webgl": "WebGL",
  "three.js": "Three.js",
  "threejs": "Three.js",
  "3d": "3D",
  "vr": "VR",
  "vr video": "VR Video",
  "opengl": "OpenGL",
  "glsl": "GLSL",
  "shader": "Shader",
  "visualisation": "Visualization",

  // Hardware & IoT
  "iot": "IoT",
  "raspberry pi": "Raspberry Pi",
  "raspberry-pi": "Raspberry Pi",

  // Philosophy, Esotericism & Key People
  "i ching": "I Ching",
  "i-ching": "I Ching",
  "terence mckenna": "Terence McKenna",
  "terence-mckenna": "Terence McKenna",
  "novelty theory": "Novelty Theory",

  // Algorithms & Math
  "dijkstras algorithm": "Dijkstra’s algorithm",
  "dijkstras-algorithm": "Dijkstra’s algorithm",
  "dijkstra's algorithm": "Dijkstra’s algorithm",
  "shortest path": "Shortest Path",
  "shortest-path": "Shortest Path",
  "quantum physics": "Quantum Physics",
  "quantum-physics": "Quantum Physics",
  "procedural generation": "Procedural Generation",
  "procedural-generation": "Procedural Generation",
  "systems and complexity": "Systems & Complexity",
  "systems-and-complexity": "Systems & Complexity",
  "fuzzy search": "Fuzzy Search",

  // Libraries & Frameworks
  "fusej.js": "Fuse.js",
  "fuse.js": "Fuse.js",
  "react": "React",
  "next.js": "Next.js",
  "vite": "Vite",
  "ember.js": "Ember.js",
  "angular.js": "Angular.js",
  "c#": "C#",
  "c++": "C++",
  "qt": "Qt",
  "python": "Python",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "mtproto": "MTProto",
  "github actions": "GitHub Actions",
  "spotify api": "Spotify API",

  // AI & Modern Tech
  "ai": "AI",
  "llm": "LLM",
  "llms": "LLMs",
  "machine learning": "Machine Learning",
  "ssr": "SSR",
  "ui": "UI",
  "ux": "UX",
  "ios": "iOS",

  // Culture / Games / Misc
  "dwarf fortress": "Dwarf Fortress",
  "dwarf-fortress": "Dwarf Fortress",
  "global game jam": "Global Game Jam",
  "board games": "Board Games",
  "board-games": "Board Games",
  "boardgamegeek": "BoardGameGeek",
  "e-commerce": "E-Commerce",
  "front-end-development": "Front-End Development",
  "digital-wellbeing": "Digital Wellbeing",
  "self-improvement": "Self-Improvement",
  "company-culture": "Company Culture",
  "mobile-app-development": "Mobile App Development",
  "data-visualization": "Data Visualization",
  "data-analysis": "Data Analysis",
  "monitoring-software": "Monitoring Software",
  "software-engineering": "Software Engineering",
  "computer-graphics": "Computer Graphics",
};

/**
 * Formats any tag string (kebab-case, lowercase, or irregular) into
 * a pristine human-readable title-cased representation with proper acronyms.
 */
export function formatTag(tag) {
  if (!tag || typeof tag !== "string") return "";

  const trimmed = tag.trim();
  const normalizedKey = trimmed.toLowerCase();

  if (EXACT_TAG_MAP[normalizedKey]) {
    return EXACT_TAG_MAP[normalizedKey];
  }

  // Handle hyphenated or underscored strings
  return trimmed
    .split(/[-_]/)
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (EXACT_TAG_MAP[lower]) {
        return EXACT_TAG_MAP[lower];
      }
      if (lower === "and") return "&";
      if (lower === "of") return "of";
      if (lower === "in") return "in";
      if (lower === "the") return "the";
      if (lower === "ai") return "AI";
      if (lower === "vr") return "VR";
      if (lower === "3d") return "3D";
      if (lower === "ios") return "iOS";
      if (lower === "ui") return "UI";
      if (lower === "ux") return "UX";
      if (lower === "api") return "API";
      if (lower === "iot") return "IoT";

      // Capitalize first letter of words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
