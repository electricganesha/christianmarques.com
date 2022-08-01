import React from "react";
import styles from "./ProjectCard.module.scss";
import Link from "next/link";
import {format} from "date-fns";
import Image from "next/image";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../utils/cloudinary";

const ProjectCard = ({project}) => {
  return (
    <div className={styles.projectCard}>
      <Link href={`/projects/${project.slug}`}>
        <a>
          <p>
            {project.name}
          </p>
          <Image
            width={190}
            height={190}
            alt={`${project.name} thumbnail`}
            placeholder="blur"
            blurDataURL={convertToCloudinaryBlurURL(project.image)}
            src={cleanUpCloudinaryURL(project.image)}
          />
          <div className={styles.date}>
            {format(new Date(project.date._seconds * 1000), "MMM yyyy")}
          </div>
        </a>
      </Link>
    </div>
  );
};

export default ProjectCard;
