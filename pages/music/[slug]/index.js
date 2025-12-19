import styles from "../../../styles/MusicPage.module.scss";
import Image from "next/image";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL,
} from "../../../utils/cloudinary";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";

export default function Music(props) {
  const project = props.music;

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className={styles.project}>
      <SocialMetaTags
        name={project.name}
        description={project.description}
        image={project.image}
        url={`https://christianmarques.com/music/${project.slug}/`}
        type={"article"}
      />
      <ProjectDetail project={project} category="music" />
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("https://christianmarques-com.vercel.app/api/music");
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
    `https://christianmarques-com.vercel.app/api/music/${params.slug}`
  );
  const music = await res.json();

  return {
    props: { music: music[0] },
  };
};
