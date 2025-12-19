import styles from "../../../styles/WritingPage.module.scss";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";

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
      <ProjectDetail project={writing} category="writing" />
    </div>
  );
}

export async function getStaticPaths() {
  const res = await fetch(
    "https://christianmarques-com.vercel.app/api/writing"
  );
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
    `https://christianmarques-com.vercel.app/api/writing/${params.slug}`
  );
  const writing = await res.json();

  return {
    props: { writing: writing[0] },
  };
};
