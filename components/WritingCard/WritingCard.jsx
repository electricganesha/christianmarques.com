import React, { useState, useCallback } from "react";
import styles from "./WritingCard.module.scss";
import Link from "next/link";
import { format } from "date-fns";

const WritingCard = ({ project }) => {
  return (
    <div className={styles.writingCard}>
      <Link href={`/writing/${project.slug}`}>
        <a>
          <p>
            {format(new Date(project.date._seconds * 1000), "MMM yyyy")} &mdash;{" "}
            {project.name}
          </p>
          <div
            className={styles.image}
            style={{
              backgroundImage: `url("${project.image}")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
          <p className={styles.writingCard__bold}>{project.description}</p>
          {project.publisher && project.publisher.length > 0 && (
            <a href={project.publisher[1]}>
              <p className={styles.writingCard__publisher}>
                {project.publisher[0]}
              </p>
            </a>
          )}
        </a>
      </Link>
    </div>
  );
};

export default WritingCard;
