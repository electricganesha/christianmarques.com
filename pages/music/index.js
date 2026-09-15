import styles from "../../styles/Music.module.scss";
import CardV1 from "../../components/CardV1/CardV1";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import ProjectCardSmall from "../../components/ProjectCardSmall/ProjectCardSmall";

export default function Projects(props) {
  const router = useRouter();
  const music = props.music;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Music & Soundscapes — Christian Marques"
        description="Sound design, ambient compositions, experimental noise, and collaborative albums by Christian Marques."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776906/christianmarques.com/website/music.png"
        url="https://christianmarques.com/music/"
        type="website"
      />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Music</h1>
        <p className={styles.pageSubtitle}>
          Sound design, ambient compositions, experimental noise, and collaborative albums
        </p>
      </header>
      <div className={styles.grid}>
        {music.map((musicItem) => (
          <ProjectCardSmall
            key={musicItem.id}
            project={musicItem}
            category="music"
          />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/music");
  const music = await res.json();
  return {
    props: { music },
  };
};
