import styles from "../../styles/Writing.module.scss";
import WritingCard from "../../components/WritingCard/WritingCard";
import Loader from "../../components/Loader/Loader";
import { useRouter } from "next/router";

export default function Projects(props) {
  const router = useRouter();
  const writing = props.writing;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {writing.map((project) => (
          <WritingCard project={project} key={project.slug}/>
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("http://localhost:3000/api/writing");
  const writing = await res.json();
  return {
    props: { writing },
  };
};
