const admin = require("firebase-admin");
const serviceAccount = require("../utils/serviceAccountKey.js");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount.serviceAccountKey),
    databaseURL: process.env.FIREBASE_FIRESTORE_URL,
  });
}

const db = admin.firestore();

// 1. Curated summaries
const CURATED_PROJECT_SUMMARIES = {
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

// 2. Curated tiers
const CURATED_TIERS = {
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

function extractShortSummary(htmlOrText, maxSentences = 2) {
  if (!htmlOrText || typeof htmlOrText !== "string") return "";
  const text = htmlOrText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  const sentenceMatches = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  if (sentenceMatches && sentenceMatches.length > 0) {
    const selected = sentenceMatches.slice(0, maxSentences).join("").trim();
    if (selected.length <= 220) return selected;
  }
  if (text.length <= 160) return text;
  const truncated = text.slice(0, 160);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated).trim() + "...";
}

function determineCategories(p) {
  const slug = (p.slug || "").toLowerCase();
  const tags = (p.tags || []).map((t) => t.toLowerCase());
  const category = (p.category || "").toLowerCase();

  const cats = [];

  // 3d
  if (
    slug === "timewavezero" ||
    slug === "promaton" ||
    slug === "baetes" ||
    slug === "vodafone-vr" ||
    tags.some((t) => ["3d", "three.js", "webgl", "opengl", "vr", "glsl", "shader"].includes(t)) ||
    category.includes("3d")
  ) {
    cats.push("3d");
  }

  // ai
  if (
    slug === "promaton" ||
    slug === "cleromancer" ||
    slug === "hamster" ||
    tags.some((t) => ["ai", "machine learning", "computer vision", "algorithm", "iot"].includes(t))
  ) {
    cats.push("ai");
  }

  // creative
  if (
    slug === "timewavezero" ||
    slug === "cleromancer" ||
    slug === "chronic-poetics" ||
    slug === "sjgmusic" ||
    slug === "hypseus" ||
    tags.some((t) => ["creative coding", "interactive", "generative", "poetry", "art", "music"].includes(t))
  ) {
    cats.push("creative");
  }

  // web
  if (
    slug === "cleromancer" ||
    slug === "timewavezero" ||
    slug === "promaton" ||
    slug === "trouva" ||
    slug === "nerdscavenge" ||
    slug === "meeple-night" ||
    slug === "push" ||
    tags.some((t) => ["react", "next.js", "web", "frontend", "full-stack", "typescript", "javascript"].includes(t))
  ) {
    cats.push("web");
  }

  // games
  if (
    slug === "ripair" ||
    slug === "spy-or-die" ||
    slug === "awp" ||
    slug === "panic-plane" ||
    slug === "hipponaut" ||
    slug === "liberdade-quiz" ||
    tags.some((t) => ["game", "games", "unity", "unreal", "game design", "arcade"].includes(t))
  ) {
    cats.push("games");
  }

  return cats;
}

function determineSection(slug, p) {
  if (CURATED_TIERS.featured.includes(slug)) return "featured";
  if (CURATED_TIERS.professional.includes(slug)) return "professional";
  if (CURATED_TIERS.experiments.includes(slug)) return "experiments";
  if (CURATED_TIERS.archive.includes(slug)) return "archive";

  // Fallback by date
  if (p.date && p.date._seconds && p.date._seconds < 1577836800) {
    return "archive";
  }
  return "experiments";
}

// 3. About page data
const ABOUT_DATA = {
  technicalFocus: [
    {
      title: "3D & Interactive Graphics",
      description:
        "Three.js, WebGL, WebGPU, GLSL Shaders, Procedural Geometry, Kinematics, Medical 3D Volume Rendering.",
    },
    {
      title: "Full-Stack Architecture",
      description:
        "TypeScript, React, Next.js, Node.js, GraphQL, REST APIs, Performance Optimization, Micro-frontends.",
    },
    {
      title: "Creative Computing & AI",
      description:
        "Algorithmic generation, LLM integration, agent systems, computational music, digital humanities, and systems thinking.",
    },
  ],
  volunteering: [
    "Colliding Lines (Community Arts), Cambridge, UK",
    "Museu do Aljube (History Communication), Lisbon, Portugal",
    "Emergence Hackathon (Science Communication), Lisbon, Portugal",
    "Cultura no Muro (Community Arts), Cascais, Portugal",
    "VolNepal (Community Infrastructure), Kathmandu, Nepal",
    "EPIA Conference Support, Lisbon, Portugal",
    "FCUL Peer Mentoring, Lisbon, Portugal",
  ],
  languages: [
    "Portuguese (Native)",
    "English (Fluent / Professional)",
    "Spanish (Professional proficiency)",
    "French (Conversational)",
    "Italian (Basic)",
  ],
  influences:
    "Inspiration comes as much from philosophy, cinema, and music as from mathematics and code. Enduring touchstones include: Tom Waits, Ludwig van Beethoven, Andrei Tarkovsky, Hidetaka Miyazaki, Hayao Miyazaki, Kurt Vonnegut, William S. Burroughs, José Afonso, Hideo Kojima, Byung-Chul Han, Carlos Paredes, Masanobu Fukuoka, Terence McKenna, Alejandro Jodorowsky, The Beatles, Paul Thomas Anderson, Nick Cave and the Bad Seeds, Werner Herzog, George Orwell, Stanley Kubrick, and Orson Welles — among many others that inspire my creative journey.",
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function migrate() {
  console.log("=== Starting Firestore Migration ===");

  // A. Migrate Projects in "software" collection
  console.log("\n1. Fetching projects from 'software' collection...");
  const snapshot = await db.collection("software").get();
  console.log(`Found ${snapshot.size} projects in 'software'.`);

  const batch = db.batch();
  let updatedProjects = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const slug = (data.slug || "").toLowerCase();

    // Summary
    let summary = data.summary;
    if (!summary) {
      summary = CURATED_PROJECT_SUMMARIES[slug] || extractShortSummary(data.description || data.text || "");
    }

    // Section & Featured
    const section = determineSection(slug, data);
    const featured = section === "featured";

    // Categories
    const categories = determineCategories(data);

    const updatePayload = {
      summary,
      section,
      featured,
      categories,
    };

    console.log(` -> [${slug.padEnd(18)}] section: ${section.padEnd(12)} featured: ${String(featured).padEnd(5)} categories: [${categories.join(", ")}]`);

    batch.set(doc.ref, updatePayload, { merge: true });
    updatedProjects++;
  });

  // B. Migrate About / Profile data
  console.log("\n2. Storing About / Profile data in 'profile/about'...");
  const aboutRef = db.collection("profile").doc("about");
  batch.set(aboutRef, ABOUT_DATA, { merge: true });

  // Commit batch
  console.log("\nCommitting Firestore batch write...");
  await batch.commit();
  console.log(`✅ Successfully updated ${updatedProjects} projects and 'profile/about' document!`);

  // Verification read
  console.log("\n3. Verifying sample documents from Firestore:");
  const testSnap = await db.collection("software").where("slug", "in", ["promaton", "timewavezero", "trouva"]).get();
  testSnap.docs.forEach((d) => {
    const p = d.data();
    console.log(` - Verified ${p.slug}: section=${p.section}, featured=${p.featured}, summary="${p.summary.slice(0, 45)}...", categories=[${p.categories.join(",")}]`);
  });

  const aboutSnap = await aboutRef.get();
  if (aboutSnap.exists) {
    const a = aboutSnap.data();
    console.log(` - Verified profile/about: ${a.technicalFocus.length} focus areas, ${a.volunteering.length} volunteering, ${a.languages.length} languages.`);
  }

  console.log("\n=== Migration Completed Successfully! ===");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
