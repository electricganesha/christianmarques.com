import { useRouter } from "next/router";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import styles from "../../styles/Writing.module.scss";

import BlogCard from "../../components/BlogCard/BlogCard";
import Loader from "../../components/Loader/Loader";

export default function Blog(props) {
  const router = useRouter();
  const posts = props.posts.items;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Christian Marques - Blog"
        description="A selection of Christian Marques' blog posts, posted originally in Medium and ranging a variety of subjects."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623927670/christianmarques.com/website/Screenshot_2021-06-17_at_11.31.49.png"
        url="https://christianmarques.com/blog/"
        type={"article"}
      />
      <div className={styles.grid}>
        {posts.map((post) => (
          <BlogCard post={post} />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@christian.marques"
  );
  const posts = await res.json();
  return {
    props: { posts },
  };
};
