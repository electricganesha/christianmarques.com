import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { ChevronDown } from "lucide-react";
import styles from "../../styles/Projects.module.scss";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import Loader from "../../components/Loader/Loader";
import ProjectCardSmall from "../../components/ProjectCardSmall/ProjectCardSmall";
import {
  curateProjects,
  sanitizeProjectsList,
  CATEGORY_FILTERS,
  matchesCategory,
  sortProjectsByDateDesc,
} from "../../utils/projectsData";
import db from "../../utils/db";

export default function Projects(props) {
  const router = useRouter();
  const rawProjects = props.projects || [];
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAllSections, setShowAllSections] = useState(false);

  const curated = useMemo(() => {
    return curateProjects(rawProjects);
  }, [rawProjects]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === "all") return [];
    return sanitizeProjectsList(rawProjects)
      .filter((p) => matchesCategory(p, activeCategory))
      .sort(sortProjectsByDateDesc);
  }, [rawProjects, activeCategory]);

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Projects — Christian Marques"
        description="Explore interactive 3D graphics, AI systems, creative computing experiments, and production web applications by Christian Marques."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776907/christianmarques.com/website/projects.png"
        url="https://christianmarques.com/projects/"
        type="website"
      />

      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Projects</h1>
        <p className={styles.pageSubtitle}>
          Interactive 3D graphics, web and mobile applications and creative
          coding.
        </p>
      </header>

      <nav
        className={styles.filterBar}
        aria-label="Filter projects by discipline"
      >
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.filterBtn} ${
              activeCategory === cat.id ? styles.filterBtnActive : ""
            }`}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {activeCategory === "all" ? (
        <>
          {/* 1. Featured Work */}
          <section
            className={styles.section}
            aria-labelledby="heading-featured"
          >
            <div className={styles.sectionHeader}>
              <h2 id="heading-featured" className={styles.sectionTitle}>
                Featured Work
              </h2>
              <p className={styles.sectionSubtitle}>
                Some of my favourite and most recent systems, tools, and case
                studies.
              </p>
            </div>
            <div className={styles.grid}>
              {curated.featured.map((project, index) => (
                <ProjectCardSmall
                  key={project.id || project.slug}
                  project={project}
                  index={index}
                  category="projects"
                />
              ))}
            </div>
          </section>

          {/* 2. Professional Experience */}
          <section
            className={styles.section}
            aria-labelledby="heading-professional"
          >
            <div className={styles.sectionHeader}>
              <h2 id="heading-professional" className={styles.sectionTitle}>
                Professional Experience
              </h2>
              <p className={styles.sectionSubtitle}>
                A selection of my jobs, client projects, and organisational
                roles.
              </p>
            </div>
            <div className={styles.grid}>
              {curated.professional.map((project, index) => (
                <ProjectCardSmall
                  key={project.id || project.slug}
                  project={project}
                  index={index}
                  category="projects"
                />
              ))}
            </div>
          </section>

          {!showAllSections ? (
            <div className={styles.loadMoreContainer}>
              <button
                type="button"
                className={styles.loadMoreButton}
                onClick={() => setShowAllSections(true)}
                aria-label="Load remaining experiments and archive projects"
              >
                <span>
                  Explore Experiments & Archive (
                  {curated.experiments.length + curated.archive.length} more)
                </span>
                <ChevronDown size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* 3. Experiments & Personal Projects */}
              <section
                className={styles.section}
                aria-labelledby="heading-experiments"
              >
                <div className={styles.sectionHeader}>
                  <h2 id="heading-experiments" className={styles.sectionTitle}>
                    Experiments & Personal Projects
                  </h2>
                  <p className={styles.sectionSubtitle}>
                    Algorithmic toys, creative prototypes, games, and community
                    tools
                  </p>
                </div>
                <div className={styles.grid}>
                  {curated.experiments.map((project, index) => (
                    <ProjectCardSmall
                      key={project.id || project.slug}
                      project={project}
                      index={index}
                      category="projects"
                    />
                  ))}
                </div>
              </section>

              {/* 4. Archive */}
              {curated.archive.length > 0 && (
                <section
                  className={styles.section}
                  aria-labelledby="heading-archive"
                >
                  <div className={styles.sectionHeader}>
                    <h2 id="heading-archive" className={styles.sectionTitle}>
                      Archive
                    </h2>
                    <p className={styles.sectionSubtitle}>
                      Earlier projects and historical work
                    </p>
                  </div>

                  <div className={styles.grid}>
                    {curated.archive.map((project, index) => (
                      <ProjectCardSmall
                        key={project.id || project.slug}
                        project={project}
                        index={index}
                        category="projects"
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </>
      ) : (
        <section className={styles.section} aria-label="Filtered Projects">
          {filteredProjects.length > 0 ? (
            <div className={styles.grid}>
              {filteredProjects.map((project, index) => (
                <ProjectCardSmall
                  key={project.id || project.slug}
                  project={project}
                  index={index}
                  category="projects"
                />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No projects found in this category.</p>
            </div>
          )}
        </section>
      )}
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
            ? {
                _seconds: data.date._seconds,
                _nanoseconds: data.date._nanoseconds || 0,
              }
            : data.date,
      };
    });
    return {
      props: { projects: sanitizeProjectsList(rawProjects) },
    };
  } catch (err) {
    try {
      const res = await fetch(
        "https://christianmarques-com.vercel.app/api/projects",
      );
      const rawProjects = await res.json();
      return {
        props: { projects: sanitizeProjectsList(rawProjects) },
      };
    } catch {
      return {
        props: { projects: [] },
      };
    }
  }
};
