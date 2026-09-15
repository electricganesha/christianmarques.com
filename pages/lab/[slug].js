import styles from "../../styles/ExperimentPage.module.scss";
import Image from "next/image";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../../components/StructuredData/StructuredData";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL,
} from "../../utils/cloudinary";
import ProjectDetail from "../../components/ProjectDetail/ProjectDetail";
import {
  getBreadcrumbSchema,
  getProjectDetailSchema,
} from "../../utils/structuredData";

export default function Experiment(props) {
  const project = props.experiment;

  if (!project) {
    return null;
  }

  const cleanDescription = (
    project.summary ||
    (project.description || "").replace(/<[^>]*>/g, "").trim()
  ).slice(0, 160);

  const breadcrumbs = [
    { name: "Home", url: "https://christianmarques.com/" },
    { name: "Lab", url: "https://christianmarques.com/lab/" },
    {
      name: project.name,
      url: `https://christianmarques.com/lab/${project.slug}/`,
    },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getProjectDetailSchema({
      project,
      category: "lab",
      isPortuguese: false,
    }),
  ].filter(Boolean);

  return (
    <div className={styles.project}>
      <SocialMetaTags
        name={`${project.name} — Lab | Christian Marques`}
        description={cleanDescription || `Interactive experiment ${project.name} by Christian Marques.`}
        image={project.image}
        url={`https://christianmarques.com/lab/${project.slug}/`}
        type="article"
      />
      <StructuredData data={schemas} />
      <ProjectDetail project={project} category="lab" />
    </div>
  );
}

import db from "../../utils/db";

export async function getStaticPaths() {
  try {
    const snapshot = await db.collection("lab").get();
    const paths = snapshot.docs
      .map((doc) => {
        const slug = (doc.data().slug || "").trim();
        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean);

    return {
      paths,
      fallback: false,
    };
  } catch (err) {
    try {
      const res = await fetch("https://christianmarques-com.vercel.app/api/lab");
      const data = await res.json();
      const paths = (data || [])
        .map((project) => {
          const slug = (project.slug || "").trim();
          return slug ? { params: { slug } } : null;
        })
        .filter(Boolean);

      return {
        paths,
        fallback: false,
      };
    } catch {
      return {
        paths: [],
        fallback: false,
      };
    }
  }
}

export const getStaticProps = async ({ params }) => {
  const cleanSlug = (params.slug || "").trim();
  try {
    const snapshot = await db
      .collection("lab")
      .where("slug", "in", [cleanSlug, ` ${cleanSlug}`])
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        props: {
          experiment: {
            id: doc.id,
            ...data,
            slug: cleanSlug,
            date:
              data.date && typeof data.date === "object" && "_seconds" in data.date
                ? { _seconds: data.date._seconds, _nanoseconds: data.date._nanoseconds || 0 }
                : data.date,
          },
        },
      };
    }
  } catch (err) {
    console.error("Firestore error loading lab experiment:", err);
  }

  try {
    const res = await fetch(
      `https://christianmarques-com.vercel.app/api/lab/${cleanSlug}`
    );
    const experiment = await res.json();
    const item = Array.isArray(experiment) ? experiment[0] : experiment;
    return {
      props: { experiment: { ...item, slug: cleanSlug } },
    };
  } catch {
    return {
      notFound: true,
    };
  }
};
