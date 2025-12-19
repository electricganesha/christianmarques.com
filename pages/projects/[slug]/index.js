import styles from "../../../styles/ProjectPage.module.scss";
import Image from "next/image";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL,
} from "../../../utils/cloudinary";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";

export default function Projects(props) {
  const project = props.project;

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className={styles.project}>
      <SocialMetaTags
        name={project.name}
        description={project.description}
        image={project.image}
        url={`https://christianmarques.com/projects/${project.slug}/`}
        type={"article"}
      />
      <ProjectDetail project={project} category="projects" />
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch(
    "https://christianmarques-com.vercel.app/api/projects"
  );
  const data = await res.json();

  const paths = data.map((project) => {
    return {
      params: {
        slug: project.slug,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
}

export const getStaticProps = async ({ params }) => {
  const res = await fetch(
    `https://christianmarques-com.vercel.app/api/projects/${params.slug}`
  );
  const project = await res.json();

  return {
    props: { project: project[0] },
  };
};
