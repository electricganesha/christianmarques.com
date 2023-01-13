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
        url={`https://christianmarques.com/lab/${project.slug}/`}
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
          <div className={styles.project__links}>
            {project.links &&
              project.links.length > 0 &&
              project.links.map((link) => (
                <>
                  <a key={link.url} href={link.url} target="_blank">
                    {link.title}
                  </a>
                  <br />
                </>
              ))}
          </div>
          {project.gallery && project.gallery.length > 0 && (
            <div className={styles.project__gallery}>
              {project.gallery.map((image, index) => (
                <Image
                  placeholder="blur"
                  blurDataURL={convertToCloudinaryBlurURL(image)}
                  alt={`Lab gallery image - ${index}`}
                  key={index}
                  width={360}
                  height={360}
                  className={styles["project__gallery--image"]}
                  src={cleanUpCloudinaryURL(image)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("https://christianmarques-com.vercel.app/api/lab");
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
  const res = await fetch(
    `https://christianmarques-com.vercel.app/api/lab/${params.slug}`
  );
  const experiment = await res.json();

  return {
    props: {experiment: experiment[0]},
  };
};
