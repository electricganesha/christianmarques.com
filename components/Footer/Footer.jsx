import React, {useState, useCallback} from "react";
import styles from "./Footer.module.scss";
import Link from "next/link";

const Footer = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.footer__leftSide}>
        <p>© Christian Marques . 2021, all rights reserved.</p>
        <p>
          Website designed and developed by Christian Marques using{" "}
          <a href="https://nextjs.org/">Next.js</a>,{" "}
          <a href="https://reactjs.org/">ReactJS</a>,{" "}
          <a href="https://threejs.org/">Three.js</a>,{" "}
          <a href="http://kenwheeler.github.io/slick/">react-slick</a>,{" "}
          <a href="https://date-fns.org/">date-fns</a>,{" "}
          <a href="https://firebase.google.com/">Firebase</a>
        </p>
      </div>
      <div className={styles.footer__rightSide}>
        <a href="https://www.linkedin.com/in/chmarques/" target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/linkedin.png" />
        </a>
        <a href="https://twitter.com/electricganesha" target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623964751/christianmarques.com/icons/twitter.png" />
        </a>
        <a href="https://github.com/electricganesha" target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/github.png" />
        </a>
        <a href="https://www.instagram.com/electricganesha/" target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/instagram.png" />
        </a>
        <a
          href="https://www.youtube.com/channel/UCh7Zz8X6hFxEh9VZhKYRN1Q"
          target="_blank"
        >
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/youtube.png" />
        </a>
        <a href="https://www.goodreads.com/electricganesha " target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623921945/christianmarques.com/icons/goodreads.png" />
        </a>
        <a href="https://bandcamp.com/electricganesha" target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/bandcamp.png" />
        </a>
        <a href="https://soundcloud.com/christianmarques" target="_blank">
          <img src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/soundcloud.png" />
        </a>
      </div>
    </div>
  );
};

export default Footer;
