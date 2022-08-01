import React from "react";
import styles from "./WritingCard.module.scss";
import Link from "next/link";
import {format} from "date-fns";
import Image from "next/image";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../utils/cloudinary";

const WritingCard = ({project: writingItem}) => {
  return (
    <div className={styles.writingCard}>
      <Link href={`/writing/${writingItem.slug}`}>
        <a>
          <div className={styles.writingCard__text}>
            {format(
              new Date(writingItem.date._seconds * 1000),
              "MMM yyyy"
            )}{" "}
            &mdash; {writingItem.name}
          </div>
          <Image
            className={styles.image}
            width={480}
            height={240}
            alt={writingItem.name}
            placeholder="blur"
            blurDataURL={convertToCloudinaryBlurURL(writingItem.image)}
            src={cleanUpCloudinaryURL(writingItem.image)}
          />
          <div className={styles.writingCard__bold}>
            {writingItem.description}
          </div>
          {writingItem.publisher &&
            writingItem.publisher.length > 0 &&
            <a
              href={writingItem.publisher[1]}
              className={styles.writingCard__publisher}
            >
              {writingItem.publisher[0]}
            </a>}
        </a>
      </Link>
    </div>
  );
};

export default WritingCard;
