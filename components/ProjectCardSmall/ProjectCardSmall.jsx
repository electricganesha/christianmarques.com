import React, { useRef, useLayoutEffect, useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./ProjectCardSmall.module.scss";
import { getOptimizedCloudinaryUrl, getCloudinarySrcSet } from "../../utils/cloudinary";
import { formatTag } from "../../utils/tagFormatter";
import FormattedDescription from "../FormattedDescription/FormattedDescription";

const ProjectCardSmall = ({ project, index, category }) => {
  const tagsRef = useRef(null);
  const measureRef = useRef(null);
  const sortedTags = useMemo(() => {
    return project.tags ? [...project.tags].sort((a, b) => a.localeCompare(b)) : [];
  }, [project.tags]);

  const [visibleCount, setVisibleCount] = useState(
    sortedTags.length <= 1 ? sortedTags.length : 1
  );
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0, width: 0 });
  const moreRef = useRef(null);

  const calculateFit = useCallback(() => {
    if (!tagsRef.current || !measureRef.current || sortedTags.length === 0) return;
    const containerWidth = tagsRef.current.offsetWidth;
    if (containerWidth <= 0) return;

    const measureSpans = Array.from(
      measureRef.current.querySelectorAll(`.${styles.cardTag}`)
    );
    const moreSpan = measureRef.current.querySelector(`.${styles.cardTagMore}`);
    const gap = 8; // 0.5rem gap
    const moreWidth = (moreSpan ? moreSpan.offsetWidth : 36) + gap;

    let accumulated = 0;
    let fit = 0;
    for (let i = 0; i < sortedTags.length; i++) {
      const tagEl = measureSpans[i];
      if (!tagEl) break;
      const tagWidth = tagEl.offsetWidth;
      const isLast = i === sortedTags.length - 1;
      const needed = isLast ? tagWidth : tagWidth + gap + moreWidth;

      if (accumulated + needed <= containerWidth) {
        accumulated += tagWidth + gap;
        fit = i + 1;
      } else {
        break;
      }
    }

    setVisibleCount(Math.max(1, fit));
  }, [sortedTags]);

  useLayoutEffect(() => {
    calculateFit();
  }, [calculateFit]);

  useEffect(() => {
    if (!tagsRef.current) return;
    let observer = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => {
        calculateFit();
      });
      observer.observe(tagsRef.current);
    } else {
      window.addEventListener("resize", calculateFit);
    }
    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener("resize", calculateFit);
    };
  }, [calculateFit]);

  useEffect(() => {
    if (tooltipOpen && moreRef.current) {
      const rect = moreRef.current.getBoundingClientRect();
      const tooltipWidth = Math.min(300, window.innerWidth - 32);
      let left = rect.left;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (left < 16) left = 16;

      const top = rect.top - 8;
      setTooltipPos({
        left,
        top,
        width: rect.width,
      });
    }
  }, [tooltipOpen]);

  return (
    <>
      <Link href={`/${category}/${project.slug}`} passHref legacyBehavior>
        <a
          className={styles.cardLink}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <article className={styles.card}>
            <div className={styles.cardImageWrapper}>
              <img
                src={getOptimizedCloudinaryUrl(project.image, { width: 400 })}
                srcSet={getCloudinarySrcSet(project.image, [300, 400, 600])}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                alt={project.name}
                className={styles.cardImage}
                loading="lazy"
                width={380}
                height={214}
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
              <p className={styles.cardDescription}>
                <FormattedDescription text={project.summary || project.description} />
              </p>
              <div className={styles.cardTags} ref={tagsRef}>
                {sortedTags.slice(0, visibleCount).map((tag) => (
                  <span key={tag} className={styles.cardTag}>
                    {formatTag(tag)}
                  </span>
                ))}
                {visibleCount < sortedTags.length && (
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
                    aria-label={`Show ${sortedTags.length - visibleCount} more tags`}
                  >
                    +{sortedTags.length - visibleCount}
                  </span>
                )}
              </div>
            </div>
          </article>
        </a>
      </Link>
      {sortedTags.length > 0 && (
        <div
          ref={measureRef}
          className={styles.measureContainer}
          aria-hidden="true"
        >
          {sortedTags.map((tag) => (
            <span key={tag} className={styles.cardTag}>
              {formatTag(tag)}
            </span>
          ))}
          <span className={styles.cardTagMore}>+{sortedTags.length}</span>
        </div>
      )}
      {tooltipOpen && typeof window !== "undefined" && createPortal(
        <div
          className={styles.tagsTooltip}
          style={{
            position: 'fixed',
            left: `${tooltipPos.left}px`,
            top: `${tooltipPos.top}px`,
            transform: 'translateY(-100%)',
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 99999
          }}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
        >
          {sortedTags.map((tag) => (
            <span key={tag} className={styles.cardTag}>{formatTag(tag)}</span>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default ProjectCardSmall;
