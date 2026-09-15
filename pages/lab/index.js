import styles from "../../styles/Lab.module.scss";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import ProjectCardSmall from "../../components/ProjectCardSmall/ProjectCardSmall";

export default function Lab({ experiments }) {
  const router = useRouter();

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Lab & Experiments — Christian Marques"
        description="Interactive sketches, WebGL shaders, generative graphics, and creative computing explorations by Christian Marques."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776904/christianmarques.com/website/lab.png"
        url="https://christianmarques.com/lab/"
        type="website"
      />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Lab</h1>
        <p className={styles.pageSubtitle}>
          Interactive sketches, generative graphics, shaders, and creative computing explorations
        </p>
      </header>
      <div className={styles.grid}>
        {experiments.map((experiment) => (
          <ProjectCardSmall
            project={experiment}
            key={experiment.slug}
            category="lab"
          />
        ))}
      </div>
      <p className={styles.disclaimer}>
        All the experiments are interactive, you can click through to try them
        out.
      </p>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/lab");
  const experiments = await res.json();
  return {
    props: { experiments },
  };
};
