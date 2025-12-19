import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import styles from "./ProjectCardLarge.module.scss";
import Image from "next/image";
import {
  cleanUpCloudinaryURL,
  convertToCloudinaryBlurURL,
} from "../../utils/cloudinary";

const ProjectCardLarge = ({ project, index, reversed = false }) => {
  return (
    <Link
      href={`/writing/${project.slug}`}
      className={styles.projectCardLargeLink}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <article
        className={
          styles.projectCardLargeArticle +
          (reversed ? " " + styles.reversed : "")
        }
      >
        <div
          className={
            styles.projectCardLargeImageCol +
            (reversed ? " " + styles.reversed : "")
          }
        >
          <div className={styles.projectCardLargeImage}>
            <div className={styles.projectCardLargeImageInner}>
              <Image
                src={cleanUpCloudinaryURL(project.image)}
                blurDataURL={convertToCloudinaryBlurURL(project.image)}
                placeholder="blur"     
                layout="fill"
                alt={project.name}
                className={styles.projectCardLargeImg}
                loading="lazy"
              />
              <div className={styles.projectCardLargeOverlay}>
                <div className={styles.projectCardLargeOverlayContent}>
                  <div className={styles.projectCardLargeOverlayFlex}>
                    <span className={styles.projectCardLargeOverlayText}>
                      View Project
                    </span>
                    <ArrowUpRight
                      className={styles.projectCardLargeOverlayArrow}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            styles.projectCardLargeText +
            (reversed ? " " + styles.reversed : "")
          }
        >
          <div>
            <span className={styles.projectCardLargeCategory}>
              {project.category}
            </span>
            <h2 className={styles.projectCardLargeTitle}>{project.name}</h2>
          </div>
          <p className={styles.projectCardLargeDescription}>
            {project.description}
          </p>
          <div
            className={
              styles.projectCardLargeTags +
              (reversed ? " " + styles.reversed : "")
            }
          >
             {project && project.tags && project.tags.length > 0 && project.tags.sort((a, b) => a.localeCompare(b)).map((tag) => (
              <span
                key={tag}
                className={styles.projectCardLargeTag}
              >
                {tag}
              </span>
            ))} 
          </div>
          <div className={styles.projectCardLargeDate}>
            <span>
              {project.date &&
              typeof project.date === "object" &&
              "_seconds" in project.date &&
              "_nanoseconds" in project.date
                ? new Date(project.date._seconds * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric' })
                : project.date}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProjectCardLarge;
