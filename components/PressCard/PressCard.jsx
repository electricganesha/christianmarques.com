import React from "react";
import styles from "./PressCard.module.scss";
import Link from "next/link";
import { format } from "date-fns";
import {Image, Placeholder } from 'cloudinary-react';

const ProjectCard = ({ project }) => {
  return (
    <div className={styles.projectCard}>
      <Link href={`/press/${project.slug}`}>
        <a>
          <p>{project.name}</p>
          <Image 
            src={project.image}>
              <Placeholder type="blur" />
          </Image> 
          <div className={styles.date}>
            {format(new Date(project.date._seconds * 1000), "MMM yyyy")}
          </div>
        </a>
      </Link>
    </div>
  );
};

export default ProjectCard;
