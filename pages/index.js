import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import styles from "../styles/Home.module.scss";
import DynamicWebGL from "../components/WebGLSnippet/DynamicWebGL";
import SocialMetaTags from "../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../components/StructuredData/StructuredData";
import { getPersonSchema, getWebSiteSchema } from "../utils/structuredData";
import { curateProjects } from "../utils/projectsData";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinary";
import { formatTag } from "../utils/tagFormatter";
import db from "../utils/db";

const FALLBACK_FEATURED = [
  {
    slug: "timewavezero",
    name: "Timewave Zero Explorer",
    category: "3D Graphics & Novelty Math",
    description:
      "An interactive, GPU-accelerated 3D exploration of Terence McKenna's fractal time theory and the King Wen I Ching sequence, scrubbing 6,000 years of temporal dynamics.",
    image:
      "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776910/christianmarques.com/website/timewavezero.png",
    tags: ["Three.js", "WebGL", "Fractals", "Mathematics"],
  },
  {
    slug: "cleromancer",
    name: "Cleromancer",
    category: "AI & Cultural Preservation",
    description:
      "A minimalist algorithmic companion for authentic 49-yarrow-stalk I Ching divination, calculating primary and nuclear hexagrams with strict classical probability curves.",
    image:
      "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776906/christianmarques.com/website/cleromancer.png",
    tags: ["TypeScript", "Next.js", "Algorithms", "I Ching"],
  },
  {
    slug: "promaton",
    name: "Promaton 3D Medical Diagnostics",
    category: "Medical Imaging & 3D WebGL",
    description:
      "Clinical-grade 3D WebGL visualization and interactive diagnostic software for AI-segmented Cone Beam CT dental scans across European and US clinical laboratories.",
    image:
      "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776906/christianmarques.com/website/promaton.png",
    tags: ["Three.js", "WebGL", "Medical AI", "Architecture"],
  },
];

export default function Home({ featuredProjects = [] }) {
  const title = "Christian Marques — Software Engineer & Creative Technologist";
  const description =
    "Portfolio of Christian Marques, software engineer and creative technologist specializing in interactive 3D graphics, WebGL, AI systems, and experimental digital projects.";

  const displayProjects =
    featuredProjects && featuredProjects.length >= 3
      ? featuredProjects.slice(0, 3)
      : FALLBACK_FEATURED;

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name={title}
        description={description}
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776624/christianmarques.com/website/Screenshot_2026-01-07_at_09.02.15.png"
        url="https://christianmarques.com/"
        type="website"
      />
      <StructuredData data={[getPersonSchema(), getWebSiteSchema()]} />

      <DynamicWebGL />

      <section className={styles.heroSection}>
        <div className={styles.titleContainer}>
          <img
            src="/hexagram55.png"
            alt="Hexagram 55"
            className={styles.hexagramIcon}
            width={96}
            height={96}
          />
          <div className={styles.textContainer}>
            <h1 className={styles.title}>Christian Marques</h1>
            <p className={styles.subtitle}>
              creative technology & storytelling
            </p>
          </div>
          <img
            src="/hexagram55.png"
            alt="Hexagram 55"
            className={styles.hexagramIcon}
            width={96}
            height={96}
          />
        </div>

        <a
          href="#featured-work"
          className={styles.scrollIndicator}
          aria-label="Scroll to featured work"
        >
          <span>Explore Featured Work</span>
          <ArrowDown size={14} className={styles.scrollArrow} />
        </a>
      </section>

      <section id="featured-work" className={styles.featuredSection}>
        <div className={styles.featuredContent}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionOverline}>Selected Portfolio</span>
            <h2 className={styles.sectionTitle}>Featured Work</h2>
            <p className={styles.sectionSubtitle}>
              Software engineer & creative technologist building interactive 3D
              experiences, AI-powered tools, and experimental digital projects.
            </p>
          </div>

          <div className={styles.featuredGrid}>
            {displayProjects.map((project, idx) => (
              <Link
                key={project.slug || idx}
                href={`/projects/${project.slug}`}
                passHref
                legacyBehavior
              >
                <a className={styles.featuredCard}>
                  <div className={styles.cardMediaWrapper}>
                    <img
                      src={getOptimizedCloudinaryUrl(project.image, {
                        width: 900,
                      })}
                      alt={project.name}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                    <div className={styles.categoryBadge}>
                      {project.category || "Interactive"}
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{project.name}</h3>
                    <p className={styles.cardDescription}>
                      {project.summary || project.description}
                    </p>

                    <div className={styles.cardTags}>
                      {project.tags &&
                        project.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className={styles.cardTag}>
                            {formatTag(tag)}
                          </span>
                        ))}
                    </div>

                    <div className={styles.cardAction}>
                      <span className={styles.actionText}>Read case study</span>
                      <ArrowRight size={16} className={styles.actionArrow} />
                    </div>
                  </div>
                </a>
              </Link>
            ))}
          </div>

          <div className={styles.viewAllContainer}>
            <Link href="/projects" passHref legacyBehavior>
              <a className={styles.viewAllButton}>
                <span>Explore all projects & experiments</span>
                <ArrowRight size={18} />
              </a>
            </Link>
            <Link href="/about#contact" passHref legacyBehavior>
              <a className={styles.secondaryButton}>
                <span>About me & contact</span>
                <ArrowRight size={18} />
              </a>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export const getStaticProps = async () => {
  try {
    const snapshot = await db.collection("software").get();
    const rawProjects = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date:
          data.date && typeof data.date === "object" && "_seconds" in data.date
            ? { _seconds: data.date._seconds, _nanoseconds: data.date._nanoseconds || 0 }
            : data.date,
      };
    });
    const curated = curateProjects(rawProjects);
    const featuredProjects = curated.featured.slice(0, 3);
    return {
      props: {
        featuredProjects,
      },
    };
  } catch (err) {
    try {
      const res = await fetch("https://christianmarques-com.vercel.app/api/projects");
      const rawProjects = await res.json();
      const curated = curateProjects(rawProjects);
      const featuredProjects = curated.featured.slice(0, 3);
      return {
        props: {
          featuredProjects,
        },
      };
    } catch {
      return {
        props: {
          featuredProjects: FALLBACK_FEATURED,
        },
      };
    }
  }
};
