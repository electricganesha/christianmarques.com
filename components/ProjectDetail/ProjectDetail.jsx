import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Compass,
  Cpu,
  Sparkles,
} from "lucide-react";
import styles from "./ProjectDetail.module.scss";
import Image from "next/image";
import {
  cleanUpCloudinaryURL,
  convertToCloudinaryBlurURL,
} from "../../utils/cloudinary";
import { formatTag } from "../../utils/tagFormatter";

const cleanEmbedHtml = (html) => {
  if (!html || typeof html !== "string") return "";
  let cleaned = html.trim();
  // Strip outer quotes if the database entry stored them as a quoted string
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned.replace(/[\u201C\u201D]/g, '"');
};

const extractMediaEmbeds = (project) => {
  if (!project) return [];
  const rawSources = [];

  if (Array.isArray(project.embeds)) rawSources.push(...project.embeds);
  if (Array.isArray(project.videos)) rawSources.push(...project.videos);
  if (project.video) rawSources.push(project.video);
  if (project.embed) rawSources.push(project.embed);

  const embeds = [];

  for (const raw of rawSources) {
    if (!raw || typeof raw !== "string") continue;
    let cleaned = raw.trim();
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"');

    const iframeMatches = cleaned.match(/<iframe[\s\S]*?<\/iframe>/gi);
    if (iframeMatches && iframeMatches.length > 0) {
      for (const iframe of iframeMatches) {
        embeds.push(iframe.trim());
      }
    } else if (
      cleaned.includes("<iframe") ||
      cleaned.includes("<object") ||
      cleaned.includes("<embed")
    ) {
      embeds.push(cleaned);
    }
  }

  return Array.from(new Set(embeds));
};

const isAudioEmbed = (html) => {
  if (!html || typeof html !== "string") return false;
  return /soundcloud\.com|bandcamp\.com|spotify\.com|music\.apple\.com|<audio/i.test(
    html
  );
};

const ProjectDetail = ({ project, category = "projects", lang }) => {
  if (!project) {
    return (
      <div className={styles.contentContainer} style={{ padding: "120px 24px", textAlign: "center" }} lang={lang}>
        <p>Project details unavailable.</p>
        <Link href={`/${category}`} passHref legacyBehavior>
          <a className={styles.backLink}>
            <ArrowLeft className={styles.backIcon} /> Back to {category}
          </a>
        </Link>
      </div>
    );
  }

  // Check if project has structured case study fields populated in DB
  const caseStudy =
    project.caseStudy ||
    (project.theChallenge || project.myRole || project.architecture || project.keyOutcomes || project.outcomeAndLearning
      ? {
          theChallenge: project.theChallenge,
          myRole: project.myRole,
          architecture: project.architecture,
          keyOutcomes: project.keyOutcomes,
          outcomeAndLearning: project.outcomeAndLearning,
          metrics: project.metrics,
        }
      : null);

  const metrics = project.metrics || caseStudy?.metrics || null;
  const embeds = extractMediaEmbeds(project);
  const hasGallery = Boolean(
    project.gallery?.length || embeds.length > 0
  );

  return (
    <article lang={lang}>
      {/* Hero */}
      <section className={styles.heroSection}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={cleanUpCloudinaryURL(project.image)}
            blurDataURL={convertToCloudinaryBlurURL(project.image)}
            placeholder="blur"
            layout="fill"
            alt={project.name || "Project preview"}
            className={styles.heroImage}
            priority
          />
          <div className={styles.heroGradient} />
        </div>
        <div className={styles.heroContent}>
          <Link href={`/${category}`} passHref legacyBehavior>
            <a className={styles.backLink}>
              <ArrowLeft className={styles.backIcon} /> Back to{" "}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </a>
          </Link>
          <div className={styles.heroTextWrapper}>
            <div className={styles.heroMeta}>
              <span className={styles.heroCategory}>{project.category || "Project"}</span>
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
              {project.tags &&
                project.tags.map((tag) => (
                  <span key={tag} className={styles.heroTag}>
                    {formatTag(tag)}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Key Metrics Banner (rendered when populated in DB) */}
      {metrics && Array.isArray(metrics) && metrics.length > 0 && (
        <section className={styles.metricsSection} aria-label="Key Project Metrics">
          <div className={styles.metricsContainer}>
            <div className={styles.metricsGrid}>
              {metrics.map((metric, idx) => (
                <div key={idx} className={styles.metricCard}>
                  {metric.value && <div className={styles.metricValue}>{metric.value}</div>}
                  {metric.label && <div className={styles.metricLabel}>{metric.label}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          <div className={styles.contentGrid}>
            {/* Main Content Column */}
            <div className={styles.mainColumn}>
              {caseStudy ? (
                /* Structured Case Study View */
                <div className={styles.caseStudyContainer}>
                  {/* The Idea & Challenge */}
                  {caseStudy.theChallenge && (
                    <article className={styles.caseStudyBlock}>
                      <div className={styles.blockHeader}>
                        <Compass className={styles.blockIcon} size={22} />
                        <h2 className={styles.caseStudyHeading}>The Idea & Challenge</h2>
                      </div>
                      <div
                        className={styles.caseStudyText}
                        dangerouslySetInnerHTML={{ __html: caseStudy.theChallenge }}
                      />
                    </article>
                  )}

                  {/* Role & Scope */}
                  {caseStudy.myRole && (
                    <article className={styles.caseStudyBlock}>
                      <div className={styles.blockHeader}>
                        <Cpu className={styles.blockIcon} size={22} />
                        <h2 className={styles.caseStudyHeading}>Role & Technical Scope</h2>
                      </div>
                      <div
                        className={styles.caseStudyText}
                        dangerouslySetInnerHTML={{ __html: caseStudy.myRole }}
                      />
                    </article>
                  )}

                  {/* Outcome & Learning */}
                  {(caseStudy.outcomeAndLearning || caseStudy.keyOutcomes || caseStudy.outcome) && (
                    <article className={styles.caseStudyBlock}>
                      <div className={styles.blockHeader}>
                        <Sparkles className={styles.blockIcon} size={22} />
                        <h2 className={styles.caseStudyHeading}>Outcome & Learning</h2>
                      </div>
                      {(() => {
                        const outcomeData =
                          caseStudy.outcomeAndLearning || caseStudy.keyOutcomes || caseStudy.outcome;
                        if (typeof outcomeData === "string") {
                          return (
                            <div
                              className={styles.caseStudyText}
                              dangerouslySetInnerHTML={{ __html: outcomeData }}
                            />
                          );
                        }
                        if (Array.isArray(outcomeData)) {
                          return (
                            <div className={styles.caseStudyText}>
                              <ul className={styles.caseStudyList}>
                                {outcomeData.map((item, idx) => (
                                  <li
                                    key={idx}
                                    className={styles.caseStudyListItem}
                                    dangerouslySetInnerHTML={{ __html: item }}
                                  />
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        if (typeof outcomeData === "object") {
                          return (
                            <div className={styles.caseStudyText}>
                              {outcomeData.summary && (
                                <p dangerouslySetInnerHTML={{ __html: outcomeData.summary }} />
                              )}
                              {Array.isArray(outcomeData.points) && outcomeData.points.length > 0 && (
                                <ul className={styles.caseStudyList}>
                                  {outcomeData.points.map((pt, idx) => (
                                    <li
                                      key={idx}
                                      className={styles.caseStudyListItem}
                                      dangerouslySetInnerHTML={{ __html: pt }}
                                    />
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </article>
                  )}



                  {/* Additional Context/Text */}
                  {project.text && (
                    <article className={styles.caseStudyBlock}>
                      <h2 className={styles.caseStudyHeading}>Historical Context & Notes</h2>
                      <div
                        className={styles.caseStudyText}
                        dangerouslySetInnerHTML={{ __html: project.text }}
                      />
                    </article>
                  )}
                </div>
              ) : (
                /* Standard Narrative for projects without case study fields */
                <div className={styles.standardContainer}>
                  <div className={styles.textBlock}>
                    <h2 className={styles.sidebarHeading}>About the Project</h2>
                    <div
                      className={styles.sidebarDescription}
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  </div>

                  {project.text && (
                    <div className={styles.textBlock}>
                      <h2 className={styles.sidebarHeading}>Details & Background</h2>
                      <div
                        className={styles.sidebarDescription}
                        dangerouslySetInnerHTML={{ __html: project.text }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Column: Links, Publisher, Metadata */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarContent}>
                {/* External Links */}
                {project.link && project.link.length > 0 && (
                  <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarHeading}>Project Links</h3>
                    <div className={styles.sidebarLinks}>
                      <a
                        key={project.link[0]}
                        href={project.link[1]}
                        className={styles.sidebarLink}
                        target="_blank"
                        rel="noopener noreferrer"
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
                          target="_blank"
                          rel="noopener noreferrer"
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

                {/* Publisher */}
                {project.publisher && project.publisher.length > 0 && (
                  <div className={styles.sidebarSection}>
                    <h3 className={styles.sidebarHeading}>Publisher / Context</h3>
                    <div className={styles.sidebarLinks}>
                      <a
                        key={project.publisher[0]}
                        href={project.publisher[1]}
                        className={styles.sidebarLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className={styles.sidebarLinkLabel}>
                          {project.publisher[0]}
                        </span>
                        <ArrowUpRight className={styles.sidebarLinkIcon} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Quick Spec Card */}
                <div className={styles.quickSpecCard}>
                  <h4 className={styles.specTitle}>Metadata</h4>
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Category:</span>
                    <span className={styles.specVal}>{project.category || "Interactive"}</span>
                  </div>
                  {project.tags && project.tags.length > 0 && (
                    <div className={styles.specRow}>
                      <span className={styles.specLabel}>Primary Stack:</span>
                      <span className={styles.specVal}>{project.tags.slice(0, 4).map((t) => formatTag(t)).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* Media & Visuals Gallery Section */}
          {hasGallery && (
            <div className={styles.mediaGallerySection}>
              <h2 className={styles.gallerySectionHeading}>Project Media & Visuals</h2>
              <div className={styles.galleryList}>
                {/* Embedded Media (Interactive Demos, Videos, Audio Players) */}
                {embeds.map((embedHtml, index) => {
                  const isAudio = isAudioEmbed(embedHtml);
                  return (
                    <div
                      key={`embed-${index}`}
                      className={
                        isAudio
                          ? styles.galleryEmbedAudioWrapper
                          : styles.galleryEmbedVideoWrapper
                      }
                    >
                      <div
                        className={isAudio ? styles.embedAudio : styles.embedVideo}
                        dangerouslySetInnerHTML={{
                          __html: cleanEmbedHtml(embedHtml),
                        }}
                      />
                    </div>
                  );
                })}

                {/* Image Gallery */}
                {project.gallery &&
                  project.gallery.map((image, index) => (
                    <div key={index} className={styles.galleryImageWrapper}>
                      <Image
                        src={cleanUpCloudinaryURL(image)}
                        blurDataURL={convertToCloudinaryBlurURL(image)}
                        placeholder="blur"
                        layout="fill"
                        alt={`${project.name} - Visual ${index + 1}`}
                        className={styles.galleryImage}
                        loading="lazy"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </article>
  );
};

export default ProjectDetail;
