import { useState } from "react";
import Image from "next/image";
import { Linkedin, Github, BookOpen, Mail, ExternalLink } from "lucide-react";
import db from "../../utils/db";
import { FALLBACK_CERTIFICATIONS } from "../../utils/certificationsData";
import styles from "../../styles/About.module.scss";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import StructuredData from "../../components/StructuredData/StructuredData";
import { getPersonSchema } from "../../utils/structuredData";
import ContactForm from "../../components/ContactForm/ContactForm";
import {
  convertToCloudinaryBlurURL,
  cleanUpCloudinaryURL,
} from "../../utils/cloudinary";

const COVER_IMAGE_URL =
  "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623788588/christianmarques.com/coverImage.gif";

const FALLBACK_TECHNICAL_FOCUS = [
  {
    title: "3D & Interactive Graphics",
    description:
      "Three.js, WebGL, WebGPU, GLSL Shaders, Procedural Geometry, Kinematics, Medical 3D Volume Rendering.",
  },
  {
    title: "Full-Stack Architecture",
    description:
      "TypeScript, React, Next.js, Node.js, GraphQL, REST APIs, Performance Optimization, Micro-frontends.",
  },
  {
    title: "Creative Computing & AI",
    description:
      "Algorithmic generation, LLM integration, agent systems, computational music, digital humanities, and systems thinking.",
  },
];

const FALLBACK_VOLUNTEERING = [
  "Colliding Lines (Community Arts), Cambridge, UK",
  "Museu do Aljube (History Communication), Lisbon, Portugal",
  "Emergence Hackathon (Science Communication), Lisbon, Portugal",
  "Cultura no Muro (Community Arts), Cascais, Portugal",
  "VolNepal (Community Infrastructure), Kathmandu, Nepal",
  "EPIA Conference Support, Lisbon, Portugal",
  "FCUL Peer Mentoring, Lisbon, Portugal",
];

const FALLBACK_LANGUAGES = [
  "Portuguese (Native)",
  "English (Fluent / Professional)",
  "Spanish (Professional proficiency)",
  "French (Conversational)",
  "Italian (Basic)",
];

const FALLBACK_INFLUENCES =
  "Inspiration comes as much from philosophy, cinema, and music as from mathematics and code. Enduring touchstones include: Tom Waits, Ludwig van Beethoven, Andrei Tarkovsky, Hidetaka Miyazaki, Hayao Miyazaki, Kurt Vonnegut, William S. Burroughs, José Afonso, Hideo Kojima, Byung-Chul Han, Carlos Paredes, Masanobu Fukuoka, Terence McKenna, Alejandro Jodorowsky, The Beatles, Paul Thomas Anderson, Nick Cave and the Bad Seeds, Werner Herzog, George Orwell, Stanley Kubrick, and Orson Welles — among many others that inspire my creative journey.";

function AccordionItem({ title, items, isCertifications = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const slug = (title || "accordion").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const buttonId = `accordion-btn-${slug}`;
  const panelId = `accordion-panel-${slug}`;

  return (
    <div
      className={`${styles.detailsCard} ${
        isOpen ? styles.detailsCardOpen : ""
      }`}
    >
      <button
        type="button"
        id={buttonId}
        className={styles.detailsSummary}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span>
          {title}
          {items && items.length > 0 && ` (${items.length})`}
        </span>
        <span
          className={`${styles.accordionIcon} ${
            isOpen ? styles.accordionIconOpen : ""
          }`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className={`${styles.accordionCollapse} ${
          isOpen ? styles.accordionCollapseOpen : ""
        }`}
      >
        <div className={styles.accordionInner}>
          {isCertifications ? (
            <ul className={styles.certList}>
              {items.map((item, idx) => {
                if (typeof item === "string") {
                  return (
                    <li key={idx} className={styles.certItem}>
                      <div className={styles.certHeader}>
                        <span className={styles.certTitle}>{item}</span>
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={item.id || idx} className={styles.certItem}>
                    <div className={styles.certHeader}>
                      <span className={styles.certTitle}>
                        {item.credentialUrl ? (
                          <a
                            href={item.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.certLink}
                            title="Verify credential"
                          >
                            <span>{item.title}</span>
                            <ExternalLink
                              size={13}
                              className={styles.externalIcon}
                            />
                          </a>
                        ) : (
                          <span>{item.title}</span>
                        )}
                      </span>
                      {item.issueDate && (
                        <span className={styles.certDate}>
                          {item.issueDate}
                        </span>
                      )}
                    </div>
                    <div className={styles.certMeta}>
                      <span className={styles.certIssuer}>{item.issuer}</span>
                      {item.credentialId && (
                        <span className={styles.certId}>
                          ID: {item.credentialId}
                        </span>
                      )}
                    </div>
                    {item.skills && item.skills.length > 0 && (
                      <div className={styles.certSkills}>
                        {item.skills.map((skill, sIdx) => (
                          <span key={sIdx} className={styles.certSkillBadge}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className={styles.detailsList}>
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function About({ certifications = [], aboutData = null }) {
  const displayCertifications =
    certifications && certifications.length > 0
      ? certifications
      : FALLBACK_CERTIFICATIONS;

  const displayTechnicalFocus =
    aboutData &&
    Array.isArray(aboutData.technicalFocus) &&
    aboutData.technicalFocus.length > 0
      ? aboutData.technicalFocus
      : FALLBACK_TECHNICAL_FOCUS;

  const displayVolunteering =
    aboutData &&
    Array.isArray(aboutData.volunteering) &&
    aboutData.volunteering.length > 0
      ? aboutData.volunteering
      : FALLBACK_VOLUNTEERING;

  const displayLanguages =
    aboutData &&
    Array.isArray(aboutData.languages) &&
    aboutData.languages.length > 0
      ? aboutData.languages
      : FALLBACK_LANGUAGES;

  const displayInfluences =
    aboutData &&
    typeof aboutData.influences === "string" &&
    aboutData.influences.trim()
      ? aboutData.influences
      : FALLBACK_INFLUENCES;
  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="About Christian Marques"
        description="Background, technical expertise, engineering history, and credentials of Christian Marques — software engineer and creative technologist."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1767776902/christianmarques.com/website/about.png"
        url="https://christianmarques.com/about/"
        type="profile"
      />
      <StructuredData data={getPersonSchema()} />

      <article className={styles.wrapper}>
        {/* Header / Bio Card */}
        <header className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <Image
              placeholder="blur"
              blurDataURL={convertToCloudinaryBlurURL(COVER_IMAGE_URL)}
              alt="Christian Marques portrait"
              className={styles.coverImage}
              width={170}
              height={170}
              src={cleanUpCloudinaryURL(COVER_IMAGE_URL)}
              priority
            />
          </div>

          <div className={styles.headerText}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                gap: "1rem",
                marginBottom: "0.25rem",
                maxWidth: "100%",
                width: "410px",
              }}
            >
              <span className={styles.overline}>Biography & Profile</span>
              <span style={{ fontSize: "0.9rem", color: "#666666" }}>
                @electricganesha
              </span>
            </div>
            <h1 className={styles.nameTitle}>Christian Marques</h1>
            <p className={styles.roleSubtitle}>
              Software Engineer • Creative Technologist • Writer
            </p>

            <p className={styles.location}>
              Lisbon, Portugal (working remotely since 2017)
            </p>

            <div className={styles.contactBar}>
              <a
                href="#contact"
                className={styles.contactBtn}
                aria-label="Get in touch"
              >
                <Mail size={16} />
                <span>Contact</span>
              </a>
              <a
                href="https://www.linkedin.com/in/christianmarques/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactBtn}
              >
                <Linkedin size={16} />
                <span>LinkedIn</span>
              </a>
              <a
                href="https://github.com/electricganesha"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactBtn}
              >
                <Github size={16} />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.goodreads.com/christianmarques"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactBtn}
              >
                <BookOpen size={16} />
                <span>Goodreads</span>
              </a>
            </div>
          </div>
        </header>

        {/* Narrative Content */}
        <div className={styles.prose}>
          <section className={styles.proseSection}>
            <h2 className={styles.sectionHeading}>Introduction</h2>
            <p>
              Hello and nice to meet you. My name is Christian and I am a
              full-time senior software engineer (full-stack JavaScript &
              TypeScript), creative technologist, published poet, and amateur
              musician.
            </p>
            <p>
              Over the past decade, my work has centered at the intersection of
              rigorous software engineering and exploratory media: building
              clinical-grade 3D visualization tools for medical diagnostics,
              developing interactive WebGL applications, authoring algorithmic
              models of ancient cultural texts, and building production-grade
              cloud architectures.
            </p>
          </section>

          <section className={styles.proseSection}>
            <h2 className={styles.sectionHeading}>
              Current Focus & Professional Career
            </h2>
            <p>
              I am currently working as a Senior Software Engineer at{" "}
              <a
                href="https://www.promaton.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Promaton (part of the Straumann Group)
              </a>
              , where our team innovates dental and maxillofacial care through
              AI-driven 3D WebGL visualizations and cloud diagnostic pipelines.
              My work spans high-performance WebGL/Three.js rendering, medical
              imaging (CBCT/DICOM) segmentation viewer architecture, and
              scalable micro-frontends.
            </p>
            <p>
              Previously, I contributed to engineering teams across diverse
              domains: building e-commerce and retail experiences at{" "}
              <a
                href="https://www.trouva.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Trouva
              </a>
              , interactive installations and VR at Baetes, airline booking
              backends at Amadeus, and infrastructure and IT systems at Marsh &
              McLennan.
            </p>
            <p>
              Beyond full-time commitments, I selectively take on advisory and
              contract work for interactive web systems, 3D graphics
              prototyping, and algorithmic applications. If you have an
              interesting challenge, feel free to reach out.
            </p>
          </section>

          <section className={styles.proseSection}>
            <h2 className={styles.sectionHeading}>Education & Research</h2>
            <p>
              I graduated with a B.Sc. in Computer Science from the{" "}
              <a
                href="https://ciencias.ulisboa.pt/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Faculty of Sciences of the University of Lisbon
              </a>
              , and completed my M.Sc. in Information Systems at the same
              institution. During my studies, I spent an academic year in
              Barcelona at the{" "}
              <a
                href="https://www.upc.edu/en"
                target="_blank"
                rel="noopener noreferrer"
              >
                Polytechnic University of Catalonia
              </a>{" "}
              (UPC) through the European Erasmus programme.
            </p>
            <p>
              Following my thesis, I conducted research for nearly two years at{" "}
              <a
                href="https://www.linkedin.com/company/labmag---laboratory-of-agent-modelling/about/"
                target="_blank"
                rel="noopener noreferrer"
              >
                LabMAG
              </a>{" "}
              (Agent Modeling Laboratory), investigating multi-agent simulation
              dynamics and contributing to the architectural design of the
              interdisciplinary project NAADIR.
            </p>
          </section>

          {/* Core Competencies & Skills */}
          <section className={styles.proseSection}>
            <h2 className={styles.sectionHeading}>Technical Focus Areas</h2>
            <div className={styles.skillsGrid}>
              {displayTechnicalFocus.map((focus, idx) => (
                <div key={idx} className={styles.skillCard}>
                  <h3 className={styles.skillTitle}>{focus.title}</h3>
                  <p className={styles.skillDesc}>{focus.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Credentials Accordions */}
          <section className={styles.proseSection}>
            <h2 className={styles.sectionHeading}>
              Certifications & Volunteering
            </h2>
            <div className={styles.accordionGroup}>
              <AccordionItem
                title="Certifications & Specialized Training"
                items={displayCertifications}
                isCertifications={true}
              />

              <AccordionItem
                title="Volunteering & Community"
                items={displayVolunteering}
              />

              <AccordionItem title="Languages" items={displayLanguages} />
            </div>
          </section>

          {/* Influences */}
          <section className={styles.proseSection}>
            <h2 className={styles.sectionHeading}>Influences & Touchstones</h2>
            <p className={styles.influencesText}>{displayInfluences}</p>
          </section>

          {/* Contact Form Section */}
          <ContactForm />
        </div>
      </article>
    </div>
  );
}

export const getStaticProps = async () => {
  try {
    const certSnapshot = await db
      .collection("certifications")
      .orderBy("order", "asc")
      .get();
    const certifications = certSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let aboutData = null;
    try {
      const aboutDoc = await db.collection("profile").doc("about").get();
      if (aboutDoc.exists) {
        const raw = aboutDoc.data();
        aboutData = {
          technicalFocus: raw.technicalFocus || null,
          volunteering: raw.volunteering || null,
          languages: raw.languages || null,
          influences: raw.influences || null,
        };
      }
    } catch (aboutErr) {
      console.error("Failed to load profile/about from Firestore:", aboutErr);
    }

    return {
      props: {
        certifications:
          certifications.length > 0 ? certifications : FALLBACK_CERTIFICATIONS,
        aboutData,
      },
    };
  } catch (err) {
    console.error(
      "Failed to load certifications from Firestore, using fallback:",
      err,
    );
    return {
      props: {
        certifications: FALLBACK_CERTIFICATIONS,
        aboutData: null,
      },
    };
  }
};
