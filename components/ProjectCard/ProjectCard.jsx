import React, { useState, useCallback } from "react";
import styles from "./ProjectCard.module.scss";
import Link from "next/link";
import { format } from "date-fns";

const ProjectCard = ({ project }) => {
  return (
    <div className={styles.projectCard}>
      <Link href={`/projects/${project.slug}`}>
        <a>
          <p>{project.name}</p>
          <img src={project.image} />
          <div className={styles.date}>
            {format(new Date(project.date._seconds * 1000), "MMM yyyy")}
          </div>
        </a>
      </Link>
    </div>
  );
};

export default ProjectCard;
