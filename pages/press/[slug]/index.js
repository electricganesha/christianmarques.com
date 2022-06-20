import styles from "../../../styles/ProjectPage.module.scss";
import {Image, Placeholder } from 'cloudinary-react';
import SocialMetaTags from '../../../components/SocialMetaTags/SocialMetaTags';

export default function Press(props) {
  const press = props.press;

  if (typeof window === 'undefined') {
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
              backgroundImage: window.matchMedia("(min-width: 768px)").matches ? `url("${press.image}")` : `url("https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623841344/christianmarques.com/texture.webp")`
            }}
          >
            <div className={styles.project__container}>
              <h1>{press.name}</h1>
              <p dangerouslySetInnerHTML={{ __html: press.description }} />
              <div className={styles.project__links}>
                {press.link && press.link.length > 0 && (
                  <a href={press.link[1]} target="_blank">
                    {press.link[0]}
                  </a>
                )}
                {press.link2 && press.link2.length > 0 && (
                  <a href={press.link2[1]} target="_blank">
                    {press.link2[0]}
                  </a>
                )}
              </div>
              {press.video && (
                <div
                  className={styles.video}
                  dangerouslySetInnerHTML={{ __html: press.video }}
                />
              )}
              {press.gallery && press.gallery.length > 0 && (
                <div className={styles.project__gallery}>
                  {press.gallery.map((image, index) => (
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
  const res = await fetch("http://localhost:3000/api/press");
  const data = await res.json();
  
  const paths = data.map(press => {
    return {
    params: {
      slug: press.slug
    }
  }
  });

  return {
    paths,
    fallback: false,
  };
}

export const getStaticProps = async ({ params }) => {
  const res = await fetch(`http://localhost:3000/api/press/${params.slug}`);
  const press = await res.json();

  return {
    props: { press: press[0] },
  };
};
