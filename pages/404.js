import Link from "next/link";
import styles from "../styles/404.module.scss";
import SocialMetaTags from "../components/SocialMetaTags/SocialMetaTags";

export default function FourOhFour() {
  return (
    <div className={styles.wrapper}>
      <SocialMetaTags
        name="404 — Page Not Found | Christian Marques"
        description="The requested page could not be found."
        url="https://christianmarques.com/404"
        type="website"
      />
      <div className={styles.fourOhFour}>
        <span className={styles.statusCode}>404</span>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.description}>
          The page you are looking for might have been moved, renamed, or is
          temporarily unavailable.
        </p>
        <Link href="/" passHref legacyBehavior>
          <a className={styles.backButton}>Return to Homepage</a>
        </Link>
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
  };
};
