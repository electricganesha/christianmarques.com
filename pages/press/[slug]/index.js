import styles from "../../../styles/ProjectPage.module.scss";
import Image from "next/image";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL
} from "../../../utils/cloudinary";

export default function Press(props) {
  const press = props.press;

  if (typeof window === "undefined") {
    return null;
  }

  return (
    <div className={styles.project}>
      <SocialMetaTags
        name={press.name}
        description={press.description}
        image={press.image}
        url={`https://christianmarques.com/projects/${press.slug}/`}
        type={"article"}
      />
      <div
        className={styles.wrapper}
        style={{
          backgroundImage: window.matchMedia("(min-width: 768px)").matches
            ? `url("${press.image}")`
            : `url("https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623841344/christianmarques.com/texture.webp")`
        }}
      >
        <div className={styles.project__container}>
          <h1>
            {press.name}
          </h1>
          <p dangerouslySetInnerHTML={{__html: press.description}} />
          <div className={styles.project__links}>
            {press.link &&
              press.link.length > 0 &&
              <a href={press.link[1]} target="_blank">
                {press.link[0]}
              </a>}
            {press.link2 &&
              press.link2.length > 0 &&
              <a href={press.link2[1]} target="_blank">
                {press.link2[0]}
              </a>}
          </div>
          {press.video &&
            <div
              className={styles.video}
              dangerouslySetInnerHTML={{__html: press.video}}
            />}
          {press.gallery &&
            press.gallery.length > 0 &&
            <div className={styles.project__gallery}>
              {press.gallery.map((image, index) =>
                <Image
                  placeholder="blur"
                  blurDataURL={convertToCloudinaryBlurURL(image)}
                  alt={`Press gallery image - ${index}`}
                  width={360}
                  height={180}
                  className={styles["project__gallery--image"]}
                  src={cleanUpCloudinaryURL(image)}
                  key={index}
                />
              )}
            </div>}
        </div>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("https://christianmarques-com.vercel.app/api/press");
  const data = await res.json();

  const paths = data.map(press => {
    return {
      params: {
        slug: press.slug
      }
    };
  });

  return {
    paths,
    fallback: false
  };
}

export const getStaticProps = async ({params}) => {
  const res = await fetch(`https://christianmarques-com.vercel.app/api/press/${params.slug}`);
  const press = await res.json();

  return {
    props: {press: press[0]}
  };
};
