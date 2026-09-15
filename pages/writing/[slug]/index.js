import styles from "../../../styles/WritingPage.module.scss";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../../../components/StructuredData/StructuredData";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";
import { isPortugueseItem } from "../../../utils/language";
import {
  getBreadcrumbSchema,
  getProjectDetailSchema,
} from "../../../utils/structuredData";
import db from "../../../utils/db";

export default function Writing(props) {
  const writing = props.writing;

  if (!writing) {
    return null;
  }

  const isPt = isPortugueseItem(writing);
  const titleText = writing.name || writing.description || "Writing";
  const cleanDescription = (
    writing.summary ||
    writing.text ||
    writing.description ||
    ""
  )
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 160);

  const breadcrumbs = [
    { name: "Home", url: "https://christianmarques.com/" },
    { name: "Writing", url: "https://christianmarques.com/writing/" },
    {
      name: titleText,
      url: `https://christianmarques.com/writing/${writing.slug}/`,
    },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getProjectDetailSchema({
      project: writing,
      category: "writing",
      isPortuguese: isPt,
    }),
  ].filter(Boolean);

  return (
    <div className={styles.project} lang={isPt ? "pt" : undefined}>
      <SocialMetaTags
        name={`${titleText} — Writing | Christian Marques`}
        description={
          cleanDescription || `Publication ${titleText} by Christian Marques.`
        }
        image={writing.image}
        url={`https://christianmarques.com/writing/${writing.slug}/`}
        type="article"
        locale={isPt ? "pt_PT" : "en_US"}
      />
      <StructuredData data={schemas} />
      <ProjectDetail
        project={writing}
        category="writing"
        lang={isPt ? "pt" : undefined}
      />
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const snapshot = await db.collection("poetry").get();
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
    const res = await fetch(
      "https://christianmarques-com.vercel.app/api/writing"
    );
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
      .collection("poetry")
      .where("slug", "==", params.slug)
      .get();
    if (!snapshot.empty) {
      return {
        props: {
          writing: JSON.parse(JSON.stringify(snapshot.docs[0].data())),
        },
      };
    }
  } catch (err) {
    console.error("Firestore direct query failed, falling back to API", err);
  }

  const res = await fetch(
    `https://christianmarques-com.vercel.app/api/writing/${params.slug}`
  );
  const writing = await res.json();

  return {
    props: {
      writing: writing[0] ? JSON.parse(JSON.stringify(writing[0])) : null,
    },
  };
};

