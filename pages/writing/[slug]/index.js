import styles from "../../../styles/WritingPage.module.scss";
import Image from "next/image";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../../utils/cloudinary";

export default function Writing(props) {
  const writing = props.writing;

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className={styles.project}>
      <SocialMetaTags
        name={writing.description}
        description={writing.text}
        image={writing.image}
        url={`https://christianmarques.com/writing/${writing.slug}/`}
        type={"article"}
      />
      <div
        className={styles.wrapper}
        style={{
          backgroundImage: window.matchMedia("(min-width: 768px)").matches
            ? `url("${writing.image}")`
            : `url("https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623841344/christianmarques.com/texture.webp")`
        }}
      >
        <div className={styles.project__container}>
          <h1>
            {writing.description}
          </h1>
          <p dangerouslySetInnerHTML={{__html: writing.text}} />
          <div className={styles.project__links}>
            {writing.link &&
              writing.link.length > 0 &&
              <a href={writing.link[1]} target="_blank">
                {writing.link[0]}
              </a>}
            {writing.link2 &&
              writing.link2.length > 0 &&
              <a href={writing.link2[1]} target="_blank">
                {writing.link2[0]}
              </a>}
          </div>
          {writing.video &&
            <div
              className={styles.video}
              dangerouslySetInnerHTML={{__html: writing.video}}
            />}
          {writing.gallery &&
            writing.gallery.length > 0 &&
            <div className={styles.project__gallery}>
              {writing.gallery.map((image, index) =>
                <Image
                  placeholder="blur"
                  blurDataURL={convertToCloudinaryBlurURL(image)}
                  alt={`Writing gallery image - ${index}`}
                  key={index}
                  width={360}
                  height={180}
                  className={styles["project__gallery--image"]}
                  src={cleanUpCloudinaryURL(image)}
                />
              )}
            </div>}
        </div>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("http://localhost:3000/api/writing");
  const data = await res.json();

  const paths = data.map(project => {
    return {
      params: {
        slug: project.slug
      }
    };
  });

  return {
    paths,
    fallback: false
  };
}

export const getStaticProps = async ({params}) => {
  const res = await fetch(`http://localhost:3000/api/writing/${params.slug}`);
  const writing = await res.json();

  return {
    props: {writing: writing[0]}
  };
};
