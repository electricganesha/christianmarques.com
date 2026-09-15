import styles from "../../../styles/MusicPage.module.scss";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../../../components/StructuredData/StructuredData";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";
import { isPortugueseItem } from "../../../utils/language";
import {
  getBreadcrumbSchema,
  getProjectDetailSchema,
} from "../../../utils/structuredData";
import db from "../../../utils/db";

export default function Music(props) {
  const project = props.music;

  if (!project) {
    return null;
  }

  const isPt = isPortugueseItem(project);
  const cleanDescription = (
    project.summary ||
    (project.description || "").replace(/<[^>]*>/g, "").trim()
  ).slice(0, 160);

  const breadcrumbs = [
    { name: "Home", url: "https://christianmarques.com/" },
    { name: "Music", url: "https://christianmarques.com/music/" },
    {
      name: project.name,
      url: `https://christianmarques.com/music/${project.slug}/`,
    },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getProjectDetailSchema({
      project,
      category: "music",
      isPortuguese: isPt,
    }),
  ].filter(Boolean);

  return (
    <div className={styles.project} lang={isPt ? "pt" : undefined}>
      <SocialMetaTags
        name={`${project.name} — Music | Christian Marques`}
        description={
          cleanDescription ||
          `Musical release ${project.name} by Christian Marques.`
        }
        image={project.image}
        url={`https://christianmarques.com/music/${project.slug}/`}
        type="article"
        locale={isPt ? "pt_PT" : "en_US"}
      />
      <StructuredData data={schemas} />
      <ProjectDetail
        project={project}
        category="music"
        lang={isPt ? "pt" : undefined}
      />
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const snapshot = await db.collection("music").get();
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
  } catch {
    const res = await fetch("https://christianmarques-com.vercel.app/api/music");
    const data = await res.json();
    const paths = (data || []).map((project) => ({
      params: { slug: (project.slug || "").trim() },
    }));
    return {
      paths,
      fallback: false,
    };
  }
}

export const getStaticProps = async ({ params }) => {
  try {
    const snapshot = await db
      .collection("music")
      .where("slug", "==", params.slug)
      .get();
    if (!snapshot.empty) {
      return {
        props: {
          music: JSON.parse(JSON.stringify(snapshot.docs[0].data())),
        },
      };
    }
  } catch (err) {
    console.error("Firestore direct query failed, falling back to API", err);
  }

  const res = await fetch(
    `https://christianmarques-com.vercel.app/api/music/${params.slug}`
  );
  const music = await res.json();

  return {
    props: {
      music: music[0] ? JSON.parse(JSON.stringify(music[0])) : null,
    },
  };
};

