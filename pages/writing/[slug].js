import styles from "../../styles/WritingPage.module.scss";
import { useRouter } from "next/router";
import Loader from "../../components/Loader/Loader";

export default function Projects(props) {
  const router = useRouter();
  const writing = props.writing;

  if (router.isFallback || typeof window === 'undefined') {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      {writing ? (
        <div className={styles.project}>
          <div
            className={styles.wrapper}
            style={{ 
              backgroundImage: window.matchMedia("(min-width: 768px)").matches ? `url("${writing.image}")` : `url("https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623841344/christianmarques.com/texture.webp")`
            }}
          >
            <div className={styles.project__container}>
              <h1>{writing.description}</h1>
              <p dangerouslySetInnerHTML={{ __html: writing.text }} />
              <div className={styles.project__links}>
                {writing.link && writing.link.length > 0 && (
                  <a href={writing.link[1]} target="_blank">
                    {writing.link[0]}
                  </a>
                )}
                {writing.link2 && writing.link2.length > 0 && (
                  <a href={writing.link2[1]} target="_blank">
                    {writing.link2[0]}
                  </a>
                )}
              </div>
              {writing.video && (
                <div
                  className={styles.video}
                  dangerouslySetInnerHTML={{ __html: writing.video }}
                />
              )}
              {writing.gallery && writing.gallery.length > 0 && (
                <div className={styles.project__gallery}>
                  {writing.gallery.map((image, index) => (
                    <img
                      key={index}
                      className={styles["project__gallery--image"]}
                      src={image}
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
  const res = await fetch("http://localhost:3000/api/writing");
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
  const res = await fetch(`http://localhost:3000/api/writing/${params.slug}`);
  const writing = await res.json();

  return {
    props: { writing: writing[0] },
  };
};
