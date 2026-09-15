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
        name="Essays on Technology & Culture — Christian Marques"
        description="Essays, deep dives, and technical writing on creative technology, mathematics, systems design, and digital culture by Christian Marques."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776904/christianmarques.com/website/blog.png"
        url="https://christianmarques.com/blog/"
        type="website"
      />
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Blog</h1>
        <p className={styles.pageSubtitle}>
          Essays on creative technology, mathematics, systems, and digital culture
        </p>
      </header>
      <div className={styles.grid}>
        {posts.map((post, index) => (
          <BlogCard
            key={post.guid || post.link || index}
            post={post}
            index={index}
            reversed={index % 2 === 1}
          />
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
