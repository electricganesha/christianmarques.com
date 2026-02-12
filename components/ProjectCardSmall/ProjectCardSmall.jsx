import React, { useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./ProjectCardSmall.module.scss";

const ProjectCardSmall = ({ project, index, category }) => {
  const tagsRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(project.tags ? project.tags.length : 0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0, width: 0 });
  const moreRef = useRef(null);

  useLayoutEffect(() => {
    if (!tagsRef.current || !project.tags) return;
    const container = tagsRef.current;
    const children = Array.from(container.children);
    // Find the ellipsis span (if present)
    let ellipsisWidth = 0;
    let tagSpans = children;
    // Temporarily render all tags and the ellipsis to measure
    if (children.length > project.tags.length) {
      ellipsisWidth = children[children.length - 1].offsetWidth + 8;
      tagSpans = children.slice(0, -1);
    } else {
      // Create a temp span for ellipsis if needed
      const temp = document.createElement('span');
      temp.className = styles.cardTag;
      temp.style.visibility = 'hidden';
      temp.textContent = '…';
      container.appendChild(temp);
      ellipsisWidth = temp.offsetWidth + 8;
      container.removeChild(temp);
    }
    let totalWidth = 0;
    let fitCount = 0;
    for (let i = 0; i < tagSpans.length; i++) {
      const child = tagSpans[i];
      // If not all tags fit, reserve space for ellipsis
      const reserve = (i < project.tags.length - 1) ? ellipsisWidth : 0;
      if (totalWidth + child.offsetWidth + 8 + reserve > container.offsetWidth) break;
      totalWidth += child.offsetWidth + 8;
      fitCount++;
    }
    setVisibleCount(fitCount);
  }, [project.tags]);

  // Tooltip portal logic
  React.useEffect(() => {
    if (tooltipOpen && moreRef.current) {
      const rect = moreRef.current.getBoundingClientRect();
      setTooltipPos({
        left: rect.right + window.scrollX + 12, // 12px margin to the right
        top: rect.top + window.scrollY - 8,     // 8px above the ellipsis
        width: rect.width
      });
    }
  }, [tooltipOpen]);

  return (
    <>
      <Link href={`/${category}/${project.slug}`} passHref legacyBehavior>
        <a
          className={styles.cardLink}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <article className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <img
                src={project.image}
                alt={project.name}
                className={styles.cardImage}
                loading="lazy"
              />
              {project.wip && (
                <img
                  src="/wip.png"
                  alt="Work in progress"
                  className={styles.wipOverlay}
                />
              )}
              <div className={styles.cardOverlay}>
                <div className={styles.overlayContent}>
                  <span className={styles.overlayText}>View Project →</span>
                </div>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{project.name}</h3>
                <span className={styles.cardDate}>
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
              <p className={styles.cardDescription} dangerouslySetInnerHTML={{__html: project.description}}/>
              <div className={styles.cardTags} ref={tagsRef}>
                {project.tags && project.tags.sort((a, b) => a.localeCompare(b)).slice(0, visibleCount).map((tag) => (
                  <span key={tag} className={styles.cardTag}>
                    {tag}
                  </span>
                ))}
                {project.tags && visibleCount < project.tags.length && (
                  <span
                    className={styles.cardTagMore}
                    key="more"
                    ref={moreRef}
                    onMouseEnter={() => setTooltipOpen(true)}
                    onMouseLeave={() => setTooltipOpen(false)}
                    tabIndex={0}
                    onFocus={() => setTooltipOpen(true)}
                    onBlur={() => setTooltipOpen(false)}
                    aria-haspopup="true"
                    aria-expanded={tooltipOpen}
                  >
                    …
                  </span>
                )}
              </div>
            </div>
          </article>
        </a>
      </Link>
      {tooltipOpen && createPortal(
        <div
          className={styles.tagsTooltip}
          style={{
            position: 'absolute',
            left: tooltipPos.left,
            top: tooltipPos.top,
            zIndex: 99999
          }}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
        >
          {project.tags.sort((a, b) => a.localeCompare(b)).map((tag) => (
            <span key={tag} className={styles.cardTag}>{tag}</span>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default ProjectCardSmall;
