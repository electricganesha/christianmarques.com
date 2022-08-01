import React from "react";
import styles from "./MusicCard.module.scss";
import Link from "next/link";
import {format} from "date-fns";
import Image from "next/image";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../utils/cloudinary";

const MusicCard = ({musicItem}) => {
  return (
    <div className={styles.musicCard}>
      <Link href={`/music/${musicItem.slug}`}>
        <a>
          <p>
            {musicItem.name}
          </p>
          <Image
            className={styles.image}
            width={192}
            height={192}
            alt={musicItem.name}
            placeholder="blur"
            blurDataURL={convertToCloudinaryBlurURL(musicItem.image)}
            src={cleanUpCloudinaryURL(musicItem.image)}
          />
          <p className={styles.musicCard__bold}>
            {format(new Date(musicItem.date._seconds * 1000), "MMM yyyy")}{" "}
          </p>
        </a>
      </Link>
    </div>
  );
};

export default MusicCard;
