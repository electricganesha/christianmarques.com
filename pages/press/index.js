import { useRouter } from "next/router";
import styles from "../../styles/PressPage.module.scss";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";

import Loader from "../../components/Loader/Loader";
import ProjectCardSmall from "../../components/ProjectCardSmall/ProjectCardSmall";

export default function Press(props) {
  const router = useRouter();
  const press = props.press;

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Christian Marques - Press"
        description="Interviews, conferences, public appearances, and any social related content for Christian Marques."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776906/christianmarques.com/website/press.png"
        url="https://christianmarques.com/press/"
        type={"article"}
      />
      <div className={styles.grid}>
        {press.map((item) => (
          <ProjectCardSmall key={item.id} project={item} category="press" />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/press");
  const press = await res.json();
  return {
    props: { press },
  };
};
