/**
 * Schema.org structured data generators for Rich Results and semantic search understanding.
 */

export const PERSON_ID = "https://christianmarques.com/#person";
export const WEBSITE_ID = "https://christianmarques.com/#website";

export function getPersonSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Christian Marques",
    alternateName: "Christian G. Marques",
    url: "https://christianmarques.com",
    image:
      "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623788588/christianmarques.com/coverImage.gif",
    jobTitle: "Software Engineer & Creative Technologist",
    worksFor: {
      "@type": "Organization",
      name: "Promaton",
      url: "https://www.promaton.com",
    },
    alumniOf: [
      {
        "@type": "EducationalOrganization",
        name: "Faculty of Sciences of the University of Lisbon",
        url: "https://ciencias.ulisboa.pt/",
      },
      {
        "@type": "EducationalOrganization",
        name: "Polytechnic University of Catalonia",
        url: "https://www.upc.edu/en",
      },
    ],
    sameAs: [
      "https://www.linkedin.com/in/christianmarques/",
      "https://github.com/electricganesha",
      "https://www.goodreads.com/christianmarques",
      "https://medium.com/@christian.marques",
    ],
    knowsAbout: [
      "Software Engineering",
      "Creative Technology",
      "WebGL & Three.js",
      "Interactive 3D Graphics",
      "Agentic AI & LLMs",
      "Distributed Systems",
      "Full-Stack JavaScript/TypeScript",
    ],
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Christian Marques",
    url: "https://christianmarques.com",
    description:
      "Portfolio of Christian Marques — Software Engineer & Creative Technologist specializing in 3D WebGL visualizations, interactive graphics, and systems architecture.",
    inLanguage: "en",
    author: {
      "@id": PERSON_ID,
    },
    publisher: {
      "@id": PERSON_ID,
    },
  };
}

export function getBreadcrumbSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function getProjectDetailSchema({
  project,
  category = "projects",
  isPortuguese = false,
}) {
  if (!project) return null;

  const url = `https://christianmarques.com/${category}/${project.slug}/`;
  const cleanDescription = (
    project.summary ||
    (project.description || "").replace(/<[^>]*>/g, "").trim()
  ).slice(0, 200);

  let datePublished = undefined;
  if (project.date) {
    if (project.date._seconds) {
      datePublished = new Date(project.date._seconds * 1000).toISOString();
    } else if (typeof project.date === "string") {
      datePublished = new Date(project.date).toISOString();
    }
  }

  // Base CreativeWork / specific type mapping
  if (category === "music") {
    return {
      "@context": "https://schema.org",
      "@type": "MusicAlbum",
      name: project.name,
      headline: project.name,
      description: cleanDescription,
      url,
      image: project.image,
      datePublished,
      byArtist: {
        "@id": PERSON_ID,
      },
      inLanguage: isPortuguese ? "pt" : "en",
    };
  }

  if (category === "writing") {
    const isBook =
      project.slug === "wandering-poem" ||
      project.name?.toLowerCase().includes("book");
    return {
      "@context": "https://schema.org",
      "@type": isBook ? "Book" : "CreativeWork",
      name: project.name,
      headline: project.name,
      description: cleanDescription,
      url,
      image: project.image,
      datePublished,
      author: {
        "@id": PERSON_ID,
      },
      inLanguage: isPortuguese ? "pt" : "en",
    };
  }

  if (category === "lab") {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: project.name,
      headline: project.name,
      description: cleanDescription,
      url,
      image: project.image,
      datePublished,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web Browser",
      author: {
        "@id": PERSON_ID,
      },
      creator: {
        "@id": PERSON_ID,
      },
    };
  }

  if (category === "press") {
    return {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.name,
      headline: project.name,
      description: cleanDescription,
      url,
      image: project.image,
      datePublished,
      about: {
        "@id": PERSON_ID,
      },
      inLanguage: isPortuguese ? "pt" : "en",
    };
  }

  // Default: software/project
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    headline: project.name,
    description: cleanDescription,
    url,
    image: project.image,
    datePublished,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web Browser",
    author: {
      "@id": PERSON_ID,
    },
    creator: {
      "@id": PERSON_ID,
    },
    inLanguage: isPortuguese ? "pt" : "en",
  };
}
