import styles from "../../styles/Writing.module.scss";
import WritingCard from "../../components/WritingCard/WritingCard";
import Loader from "../../components/Loader/Loader";
import { useRouter } from "next/router";
import SocialMetaTags from '../../components/SocialMetaTags/SocialMetaTags';

export default function Projects(props) {
  const router = useRouter();
  const writing = props.writing;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags 
        name="Christian Marques - Writing"
        description="A selection of Christian Marques' writing projects, published books, poetic anthologies and pamphlets/zines."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623927670/christianmarques.com/website/Screenshot_2021-06-17_at_11.32.17.png"
        url="https://christianmarques.com/writing/" 
        type={"article"}
      />
      <div className={styles.grid}>
        {writing.map((project) => (
          <WritingCard project={project} key={project.slug}/>
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/writing");
  const writing = await res.json();
  return {
    props: { writing },
  };
};
