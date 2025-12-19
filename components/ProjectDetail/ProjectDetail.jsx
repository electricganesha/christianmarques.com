import { ArrowLeft, ArrowUpRight } from "lucide-react";
import styles from "./ProjectDetail.module.scss";
import Image from "next/image";
import {
  cleanUpCloudinaryURL,
  convertToCloudinaryBlurURL,
} from "../../utils/cloudinary";

const ProjectDetail = ({ project, category }) => {
  if (!project) {
    return <Navigate to={`/${category}`} replace />;
  }

  return (
    <>
      {/* Hero */}
      <section className={styles.heroSection}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={cleanUpCloudinaryURL(project.image)}
            blurDataURL={convertToCloudinaryBlurURL(project.image)}
            placeholder="blur"
            layout="fill"
            alt={project.name}
            className={styles.heroImage}
          />
          <div className={styles.heroGradient} />
        </div>
        <div className={styles.heroContent}>
          <a href={`/${category}`} className={styles.backLink}>
            <ArrowLeft className={styles.backIcon} /> Back to{" "}
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </a>
          <div className={styles.heroTextWrapper}>
            <div className={styles.heroMeta}>
              <span className={styles.heroCategory}>{project.category}</span>
              <span className={styles.heroDot}>•</span>
              <span className={styles.heroDate}>
                {project.date &&
                typeof project.date === "object" &&
                "_seconds" in project.date &&
                "_nanoseconds" in project.date
                  ? new Date(project.date._seconds * 1000).toLocaleString(
                      "en-US",
                      { month: "long", year: "numeric" }
                    )
                  : project.date}
              </span>
            </div>
            <h1 className={styles.heroTitle}>{project.name}</h1>
            <div className={styles.heroTags}>
              {project &&
                project.tags &&
                project.tags.map((tag) => (
                  <span key={tag} className={styles.heroTag}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          <div className={styles.contentGrid}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarContent}>
                <div>
                  <h2 className={styles.sidebarHeading}>About</h2>
                  <p className={styles.sidebarDescription} dangerouslySetInnerHTML={{ __html: project.description }}></p>
                  {project && project.text ? (
                    <p
                      className={styles.sidebarDescription}
                      dangerouslySetInnerHTML={{ __html: project.text }}
                    ></p>
                  ) : null}
                </div>

                {project.link && project.link.length > 0 && (
                  <div>
                    <h2 className={styles.sidebarHeading}>Links</h2>
                    <div className={styles.sidebarLinks}>
                      <a
                        key={project.link[0]}
                        href={project.link[1]}
                        className={styles.sidebarLink}
                      >
                        <span className={styles.sidebarLinkLabel}>
                          {project.link[0]}
                        </span>
                        <ArrowUpRight className={styles.sidebarLinkIcon} />
                      </a>
                      {project.link2 && project.link2.length > 0 && (
                        <a
                          key={project.link2[0]}
                          href={project.link2[1]}
                          className={styles.sidebarLink}
                        >
                          <span className={styles.sidebarLinkLabel}>
                            {project.link2[0]}
                          </span>
                          <ArrowUpRight className={styles.sidebarLinkIcon} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {project.publisher && project.publisher.length > 0 && (
                  <div>
                    <h2 className={styles.sidebarHeading}>Publisher</h2>
                    <div className={styles.sidebarLinks}>
                      <a
                        key={project.publisher[0]}
                        href={project.publisher[1]}
                        className={styles.sidebarLink}
                      >
                        <span className={styles.sidebarLinkLabel}>
                          {project.publisher[0]}
                        </span>
                        <ArrowUpRight className={styles.sidebarLinkIcon} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {project && (project.gallery || project.video || project.embed) ? (
              <div className={styles.gallery}>
                <h2 className={styles.galleryHeading}>Gallery</h2>
                <div className={styles.galleryList}>
                  {project && project.video || project.embed && (
                    <div
                      className={styles.galleryEmbedWrapper}
                      style={{ animationDelay: `${1 * 0.1}s` }}
                    >
                      <div
                        className={styles.embed}
                        dangerouslySetInnerHTML={{ __html: project.video || project.embed }}
                      />
                    </div>
                  )}
                  {project &&
                    project.gallery &&
                    project.gallery.map((image, index) => (
                      <div
                        key={index}
                        className={styles.galleryImageWrapper}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <Image
                          src={cleanUpCloudinaryURL(image)}
                          blurDataURL={convertToCloudinaryBlurURL(image)}
                          placeholder="blur"
                          layout="fill"
                          alt={`${project.name} - Image ${index + 1}`}
                          className={styles.galleryImage}
                          loading="lazy"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Navigation */}
      {/* <section className={styles.navSection}>
        <div className={styles.navContainer}>
          <div className={styles.navGrid}>
            <Link href={`/project/${prevProject.id}`} passHref legacyBehavior>
              <a className={styles.navPrev}>
                <div className={styles.navPrevInner}>
                  <ArrowLeft className={styles.navPrevIcon} />
                  <div>
                    <span className={styles.navLabelPrev}>Previous</span>
                    <span className={styles.navTitlePrev}>{prevProject.title}</span>
                  </div>
                </div>
              </a>
            </Link>

            <Link href={`/project/${nextProject.id}`} passHref legacyBehavior>
              <a className={styles.navNext}>
                <div className={styles.navNextInner}>
                  <div>
                    <span className={styles.navLabelNext}>Next</span>
                    <span className={styles.navTitleNext}>{nextProject.title}</span>
                  </div>
                  <ArrowUpRight className={styles.navNextIcon} />
                </div>
              </a>
            </Link>
          </div>
        </div>
      </section> */}
    </>
  );
};

export default ProjectDetail;
