import styles from "../../styles/Lab.module.scss";
import CardV1 from "../../components/CardV1/CardV1";
import {useRouter} from "next/router";
import Loader from "../../components/Loader/Loader";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";

export default function Lab({experiments}) {
  const router = useRouter();

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Christian Marques - Lab"
        description="A section to house experiments, explorations and stuff that comes out of the process."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1660301754/christianmarques.com/website/Screenshot_2022-08-12_at_11.55.26.png"
        url="https://christianmarques.com/lab/"
        type={"listing"}
      />
      <div className={styles.grid}>
        {experiments.map((experiment) => (
          <CardV1 project={experiment} key={experiment.slug} type="lab"/>
        ))}
      </div>
      <p className={styles.disclaimer}>
        All the experiments are interactive, you can click through to try them
        out.
      </p>
    </div>
  );
}

export const getStaticProps = async () => {
  const res = await fetch("https://christianmarques-com.vercel.app/api/lab");
  const experiments = await res.json();
  return {
    props: {experiments},
  };
};
