import styles from "../../../styles/ProjectPage.module.scss";
import {Image, Placeholder } from 'cloudinary-react';
import SocialMetaTags from '../../../components/SocialMetaTags/SocialMetaTags';

export default function Projects(props) {
  const project = props.project;

  if (typeof window === 'undefined') {
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
                    <Image 
                    className={styles["project__gallery--image"]}
                      src={image}
                      key={index}>
                    <Placeholder type="blur" />
                  </Image>
                  ))}
                </div>
              )}
            </div>
          </div>
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
    fallback: false,
  };
}

export const getStaticProps = async ({ params }) => {
  const res = await fetch(`http://localhost:3000/api/projects/${params.slug}`);
  const project = await res.json();

  return {
    props: { project: project[0] },
  };
};
