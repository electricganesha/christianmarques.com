import styles from "../styles/Home.module.scss";
import WebGLSnippet from "../components/WebGLSnippet";
import SocialMetaTags from "../components/SocialMetaTags/SocialMetaTags";

export default function Home() {
  const title = `Christian Marques . ${new Date().getFullYear()}`;
  const description =
    "Christian Marques - software engineer - official website.";

  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <img src="/hexagram55.png" alt="Hexagram 55" />
        <div className={styles.textContainer}>
          <h1 className={styles.title}>Christian Marques</h1>
          <p className={styles.subtitle}>creative technology & storytelling</p>
        </div>
        <img src="/hexagram55.png" alt="Hexagram 55" />
      </div>
      <SocialMetaTags
        name={title}
        description={description}
        image={`https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776624/christianmarques.com/website/Screenshot_2026-01-07_at_09.02.15.png`}
        url={`https://christianmarques.com/`}
        type={"website"}
      />
      <WebGLSnippet />
    </div>
  );
}
