import { useRouter } from "next/router";
import styles from "../../styles/Projects.module.scss";

import ProjectCard from "../../components/ProjectCard/ProjectCard";
import Loader from "../../components/Loader/Loader";

export default function Projects(props) {
  const router = useRouter();
  const projects = props.projects;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {projects.map((project) => (
          <ProjectCard project={project} key={project.slug}/>
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("http://localhost:3000/api/projects");
  const projects = await res.json();
  return {
    props: { projects },
  };
};
