import styles from "../../../styles/ProjectPage.module.scss";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";

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
      <ProjectDetail project={press} category="press" />
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch("https://christianmarques-com.vercel.app/api/press");
  const data = await res.json();

  const paths = data.map((press) => {
    return {
      params: {
        slug: press.slug,
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
    `https://christianmarques-com.vercel.app/api/press/${params.slug}`
  );
  const press = await res.json();

  return {
    props: { press: press[0] },
  };
};
