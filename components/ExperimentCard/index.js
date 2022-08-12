import React from "react";
import styles from "./ExperimentCard.module.scss";
import Link from "next/link";
import {format} from "date-fns";
import Image from "next/image";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../utils/cloudinary";

const ExperimentCard = ({experimentItem}) => {
  return (
    <div className={styles.experimentCard}>
      <Link href={`/lab/${experimentItem.slug}`}>
        <a>
          <p>
            {experimentItem.name}
          </p>
            <p className={styles["experimentCard--small"]}>
                ({experimentItem.tech})
            </p>
          <Image
            className={styles.image}
            width={192}
            height={192}
            alt={experimentItem.name}
            placeholder="blur"
            blurDataURL={convertToCloudinaryBlurURL(experimentItem.image)}
            src={cleanUpCloudinaryURL(experimentItem.image)}
          />
          <p className={styles["experimentCard--bold"]}>
            {format(new Date(experimentItem.date._seconds * 1000), "MMM yyyy")}{" "}
          </p>
        </a>
      </Link>
    </div>
  );
};

export default ExperimentCard;
