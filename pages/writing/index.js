import styles from "../../styles/Writing.module.scss";
import Loader from "../../components/Loader/Loader";
import { useRouter } from "next/router";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import ProjectCardLarge from "../../components/ProjectCardLarge/ProjectCardLarge";

export default function Projects(props) {
  const router = useRouter();
  const writing = props.writing;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Writing & Publications — Christian Marques"
        description="Published books, poetic anthologies, pamphlets, and selected literary projects by Christian Marques."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776908/christianmarques.com/website/writing.png"
        url="https://christianmarques.com/writing/"
        type="website"
      />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Writing</h1>
        <p className={styles.pageSubtitle}>
          Published books, poetic anthologies, pamphlets, and selected essays
        </p>
      </header>
      <div className={styles.grid}>
        {writing.map((project, index) => (
          <ProjectCardLarge
            project={project}
            index={index}
            key={project.slug}
            reversed={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch(
    "https://christianmarques-com.vercel.app/api/writing"
  );
  const writing = await res.json();
  return {
    props: { writing },
  };
};
