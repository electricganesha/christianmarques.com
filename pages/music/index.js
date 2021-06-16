import styles from "../../styles/Music.module.scss";
import MusicCard from "../../components/MusicCard/MusicCard";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";

export default function Projects(props) {
  const router = useRouter();
  const music = props.music;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {music.map((project) => (
          <MusicCard project={project} key={project.slug} />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("http://localhost:3000/api/music");
  const music = await res.json();
  return {
    props: { music },
  };
};
