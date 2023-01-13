import {useRouter} from "next/router";
import styles from "../../styles/Projects.module.scss";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";

import CardV1 from "../../components/CardV1/CardV1";
import Loader from "../../components/Loader/Loader";

export default function Projects(props) {
  const router = useRouter();
  const projects = props.projects;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Christian Marques - Projects"
        description="A selection of Christian Marques' software projects, from web-apps to videogames, passing through conferences, virtual-reality experiences and video-games."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623927670/christianmarques.com/website/Screenshot_2021-06-17_at_11.31.49.png"
        url="https://christianmarques.com/projects/"
        type={"article"}
      />
      <div className={styles.grid}>
        {projects.map(project =>
          <CardV1 project={project} key={project.slug} type="projects"/>
        )}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/projects");
  const projects = await res.json();
  return {
    props: {projects}
  };
};
