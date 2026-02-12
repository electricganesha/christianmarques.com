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
        name="Christian Marques - Music"
        description="A selection of Christian Marques' musical projects, from experimental and noisy to melodic and traditional."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776906/christianmarques.com/website/music.png"
        url="https://christianmarques.com/music/"
        type={"article"}
      />
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
