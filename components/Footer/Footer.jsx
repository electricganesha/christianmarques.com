import React from "react";
import styles from "./Footer.module.scss";

const Footer = () => {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.footer__leftSide}>
        <p>© Christian Marques · {new Date().getFullYear()}, all rights reserved.</p>
        <p>
          Designed & built with{" "}
          <a href="https://nextjs.org/" target="_blank" rel="noopener noreferrer">Next.js</a>,{" "}
          <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer">React</a>,{" "}
          <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a> &amp;{" "}
          <a href="https://vercel.com/" target="_blank" rel="noopener noreferrer">Vercel</a>.
        </p>
      </div>
      <div className={styles.footer__rightSide}>
        <a
          href="https://www.linkedin.com/in/christianmarques/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn Profile"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/linkedin.png"
            alt="LinkedIn"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://github.com/electricganesha"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Profile"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/github.png"
            alt="GitHub"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://www.instagram.com/electricganesha/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram Profile"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/instagram.png"
            alt="Instagram"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://www.youtube.com/channel/UCh7Zz8X6hFxEh9VZhKYRN1Q"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube Channel"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/youtube.png"
            alt="YouTube"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://www.goodreads.com/christianmarques"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Goodreads Profile"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623921945/christianmarques.com/icons/goodreads.png"
            alt="Goodreads"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://bandcamp.com/electricganesha"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Bandcamp Profile"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/bandcamp.png"
            alt="Bandcamp"
            width={16}
            height={16}
          />
        </a>
        <a
          href="https://soundcloud.com/christianmarques"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="SoundCloud Profile"
        >
          <img
            src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623775595/christianmarques.com/icons/soundcloud.png"
            alt="SoundCloud"
            width={16}
            height={16}
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
