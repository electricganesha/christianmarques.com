import styles from "../../styles/ExperimentPage.module.scss";
import Image from "next/image";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL,
} from "../../utils/cloudinary";

export default function Experiment(props) {
  const project = props.experiment;

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
      <div
        className={styles.wrapper}
        style={{
          backgroundImage: window.matchMedia("(min-width: 768px)").matches
            ? `url("${project.image}")`
            : `url("https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623841344/christianmarques.com/texture.webp")`,
        }}
      >
        <div className={styles.project__container}>
          <h1>{project.name}</h1>
          <p dangerouslySetInnerHTML={{__html: project.description}} />
          {project.link ? (
            <div className={styles.embed}>
              <div className={styles.embed__container}>
                <iframe src={project.link}></iframe>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("http://localhost:3000/api/lab");
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

export const getStaticProps = async ({params}) => {
  const res = await fetch(`http://localhost:3000/api/lab/${params.slug}`);
  const experiment = await res.json();

  return {
    props: {experiment: experiment[0]},
  };
};
