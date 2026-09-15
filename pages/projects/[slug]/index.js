import styles from "../../../styles/ProjectPage.module.scss";
import SocialMetaTags from "../../../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../../../components/StructuredData/StructuredData";
import ProjectDetail from "../../../components/ProjectDetail/ProjectDetail";
import { sanitizeProject } from "../../../utils/projectsData";
import { isPortugueseItem } from "../../../utils/language";
import {
  getBreadcrumbSchema,
  getProjectDetailSchema,
} from "../../../utils/structuredData";
import db from "../../../utils/db";

export default function ProjectPage(props) {
  const rawProject = props.project;
  const project = rawProject ? sanitizeProject(rawProject) : null;

  if (!project) {
    return (
      <div className={styles.project} style={{ padding: "140px 24px", textAlign: "center" }}>
        <h1>Project not found</h1>
        <p>The requested project could not be located.</p>
        <a href="/projects" style={{ textDecoration: "underline", marginTop: "16px", display: "inline-block" }}>
          ← Back to all projects
        </a>
      </div>
    );
  }

  const isPt = isPortugueseItem(project);
  const cleanDescription = (
    project.summary ||
    (project.description || "").replace(/<[^>]*>/g, "").trim()
  ).slice(0, 160);

  const breadcrumbs = [
    { name: "Home", url: "https://christianmarques.com/" },
    { name: "Projects", url: "https://christianmarques.com/projects/" },
    {
      name: project.name,
      url: `https://christianmarques.com/projects/${project.slug}/`,
    },
  ];

  const schemas = [
    getBreadcrumbSchema(breadcrumbs),
    getProjectDetailSchema({
      project,
      category: "projects",
      isPortuguese: isPt,
    }),
  ].filter(Boolean);

  return (
    <div className={styles.project} lang={isPt ? "pt" : undefined}>
      <SocialMetaTags
        name={`${project.name} — Christian Marques`}
        description={cleanDescription || `Case study and technical overview of ${project.name} by Christian Marques.`}
        image={project.image}
        url={`https://christianmarques.com/projects/${project.slug}/`}
        type="article"
        locale={isPt ? "pt_PT" : "en_US"}
      />
      <StructuredData data={schemas} />
      <ProjectDetail project={project} category="projects" lang={isPt ? "pt" : undefined} />
    </div>
  );
}

export async function getStaticPaths() {
  try {
    const entries = await db.collection("software").get();
    const paths = entries.docs.map((doc) => ({
      params: { slug: doc.data().slug },
    }));

    return {
      paths,
      fallback: false,
    };
  } catch (err) {
    try {
      const res = await fetch(
        "https://christianmarques-com.vercel.app/api/projects"
      );
      const data = await res.json();

      const paths = (data || []).map((project) => ({
        params: {
          slug: project.slug,
        },
      }));

      return {
        paths,
        fallback: false,
      };
    } catch {
      return {
        paths: [],
        fallback: "blocking",
      };
    }
  }
}

export const getStaticProps = async ({ params }) => {
  try {
    const entries = await db.collection("software");
    const snapshot = await entries.where("slug", "==", params.slug).get();

    if (!snapshot.empty) {
      const project = snapshot.docs[0].data();
      return {
        props: {
          project: sanitizeProject(JSON.parse(JSON.stringify(project))),
        },
      };
    }
  } catch (err) {
    console.warn("Direct Firestore fetch in getStaticProps failed, falling back to HTTP API:", err.message);
  }

  try {
    const res = await fetch(
      `https://christianmarques-com.vercel.app/api/projects/${params.slug}`
    );
    const project = await res.json();

    return {
      props: { project: sanitizeProject(project[0] || null) },
    };
  } catch (err) {
    return {
      props: { project: null },
    };
  }
};
