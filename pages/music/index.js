import styles from "../../styles/Music.module.scss";
import MusicCard from "../../components/MusicCard/MusicCard";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";
import SocialMetaTags from '../../components/SocialMetaTags/SocialMetaTags';

export default function Projects(props) {
  const router = useRouter();
  const music = props.music;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags 
        name="Christian Marques - Music"
        description="A selection of Christian Marques' musical projects, from experimental and noisy to melodic and traditional."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623927670/christianmarques.com/website/Screenshot_2021-06-17_at_11.32.37.png"
        url="https://christianmarques.com/music/" 
        type={"article"}
      />
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
