import styles from "../../styles/ProjectPage.module.scss";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";

export default function Projects(props) {
  const router = useRouter();
  const project = props.project;

  if (router.isFallback || typeof window === 'undefined') {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      {project ? (
        <div className={styles.project}>
          <div
            className={styles.wrapper}
            style={{
              backgroundImage: window.matchMedia("(min-width: 768px)").matches ? `url("${project.image}")` : `url("https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623841344/christianmarques.com/texture.webp")`
            }}
          >
            <div className={styles.project__container}>
              <h1>{project.name}</h1>
              <p dangerouslySetInnerHTML={{ __html: project.description }} />
              <div className={styles.project__links}>
                {project.link && project.link.length > 0 && (
                  <a href={project.link[1]} target="_blank">
                    {project.link[0]}
                  </a>
                )}
                {project.link2 && project.link2.length > 0 && (
                  <a href={project.link2[1]} target="_blank">
                    {project.link2[0]}
                  </a>
                )}
              </div>
              {project.video && (
                <div
                  className={styles.video}
                  dangerouslySetInnerHTML={{ __html: project.video }}
                />
              )}
              {project.gallery && project.gallery.length > 0 && (
                <div className={styles.project__gallery}>
                  {project.gallery.map((image, index) => (
                    <img
                      className={styles["project__gallery--image"]}
                      src={image}
                      key={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("http://localhost:3000/api/projects");
  const data = await res.json();
  
  const paths = data.map(project => {
    return {
    params: {
      slug: project.slug
    }
  }
  });

  return {
    paths,
    fallback: true,
  };
}

export const getStaticProps = async ({ params }) => {
  const res = await fetch(`http://localhost:3000/api/projects/${params.slug}`);
  const project = await res.json();

  return {
    props: { project: project[0] },
  };
};
