import React from "react";
import styles from "./PressCard.module.scss";
import Link from "next/link";
import {format} from "date-fns";
import Image from "next/image";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../utils/cloudinary";

const PressCard = ({project: pressItem}) => {
  return (
    <div className={styles.pressCard}>
      <Link href={`/press/${pressItem.slug}`}>
        <a>
          <p>
            {pressItem.name}
          </p>
          <Image
            width={190}
            height={190}
            alt={`${pressItem.name} thumbnail`}
            placeholder="blur"
            blurDataURL={convertToCloudinaryBlurURL(pressItem.image)}
            src={cleanUpCloudinaryURL(pressItem.image)}
          />
          <div className={styles.date}>
            {format(new Date(pressItem.date._seconds * 1000), "MMM yyyy")}
          </div>
        </a>
      </Link>
    </div>
  );
};

export default PressCard;
