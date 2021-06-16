import React, { useState, useCallback } from "react";
import styles from "./MusicCard.module.scss";
import Link from "next/link";
import { format } from "date-fns";

const MusicCard = ({ project }) => {
  return (
    <div className={styles.musicCard}>
      <Link href={`/music/${project.slug}`}>
        <a>
          <p>{project.name}</p>
          <div
            className={styles.image}
            style={{
              backgroundImage: `url("${project.image}")`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
          <p className={styles.musicCard__bold}>
            {format(new Date(project.date._seconds * 1000), "MMM yyyy")}{" "}
          </p>
        </a>
      </Link>
    </div>
  );
};

export default MusicCard;
