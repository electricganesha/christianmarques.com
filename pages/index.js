import styles from "../styles/Home.module.scss";
import WebGLSnippet from '../components/WebGLSnippet';

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <img src="/hexagram55.png" alt="Hexagram 55" />
        Christian Marques
        <img src="/hexagram55.png" alt="Hexagram 55" />
      </h1>
      <WebGLSnippet />
    </div>
  );
}
