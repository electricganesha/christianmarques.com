import styles from "../styles/Home.module.scss";
import WebGLSnippet from "../components/WebGLSnippet";
import SocialMetaTags from "../components/SocialMetaTags/SocialMetaTags";

export default function Home() {
  const title = `Christian Marques . ${new Date().getFullYear()}`;
  const description =
    "Christian Marques - software engineer - official website.";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <img src="/hexagram55.png" alt="Hexagram 55" />
        Christian Marques
        <img src="/hexagram55.png" alt="Hexagram 55" />
      </h1>
      <SocialMetaTags
        name={title}
        description={description}
        image={`https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623928254/christianmarques.com/website/Screenshot_2021-06-17_at_12.10.43.png`}
        url={`https://christianmarques.com/`}
        type={"website"}
      />
      <WebGLSnippet />
    </div>
  );
}
