import styles from "../../../styles/ProjectPage.module.scss";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../../../components/StructuredData/StructuredData";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";
import { isPortugueseItem } from "../../../utils/language";
import {
  getBreadcrumbSchema,
  getProjectDetailSchema,
} from "../../../utils/structuredData";
import db from "../../../utils/db";

export default function Press(props) {
  const press = props.press;

  if (!press) {
    return null;
  }

  const isPt = isPortugueseItem(press);
  const cleanDescription = (
    press.summary ||
    (press.description || "").replace(/<[^>]*>/g, "").trim()
  ).slice(0, 160);

  const breadcrumbs = [
    { name: "Home", url: "https://christianmarques.com/" },
    { name: "Press", url: "https://christianmarques.com/press/" },
    {
      name: press.name,
      url: `https://christianmarques.com/press/${press.slug}/`,
    },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getProjectDetailSchema({
      project: press,
      category: "press",
      isPortuguese: isPt,
    }),
  ].filter(Boolean);

  return (
    <div className={styles.project} lang={isPt ? "pt" : undefined}>
      <SocialMetaTags
        name={`${press.name} — Press | Christian Marques`}
        description={
          cleanDescription ||
          `Press feature ${press.name} covering Christian Marques.`
        }
        image={press.image}
        url={`https://christianmarques.com/press/${press.slug}/`}
        type="article"
        locale={isPt ? "pt_PT" : "en_US"}
      />
      <StructuredData data={schemas} />
      <ProjectDetail
        project={press}
        category="press"
        lang={isPt ? "pt" : undefined}
      />
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const snapshot = await db.collection("press").get();
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
    const res = await fetch("https://christianmarques-com.vercel.app/api/press");
    const data = await res.json();
    const paths = (data || []).map((press) => ({
      params: { slug: (press.slug || "").trim() },
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
      .collection("press")
      .where("slug", "==", params.slug)
      .get();
    if (!snapshot.empty) {
      return {
        props: {
          press: JSON.parse(JSON.stringify(snapshot.docs[0].data())),
        },
      };
    }
  } catch (err) {
    console.error("Firestore direct query failed, falling back to API", err);
  }

  const res = await fetch(
    `https://christianmarques-com.vercel.app/api/press/${params.slug}`
  );
  const press = await res.json();

  return {
    props: {
      press: press[0] ? JSON.parse(JSON.stringify(press[0])) : null,
    },
  };
};

