import styles from "../../styles/About.module.scss";
import Image from "next/image";
import { useRouter } from "next/router";
import SocialMetaTags from "../../components/SocialMetaTags/SocialMetaTags";
import { convertToCloudinaryBlurURL } from "../../utils/cloudinary";

export default function About() {
  const router = useRouter();

  if (router.isFallback) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <SocialMetaTags
        name="Christian Marques - About"
        description="Hello and nice to meet you, my name is Christian and I'm a full time software engineer (full-stack Javascript), published poet, amateur musician, and hobbyist photographer."
        image="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623927670/christianmarques.com/website/Screenshot_2021-06-17_at_11.33.07.png"
        url="https://christianmarques.com/about/"
        type={"article"}
      />
      <div className={styles.wrapper}>
        <Image
          placeholder="blur"
          blurDataURL={convertToCloudinaryBlurURL(
            "https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623788588/christianmarques.com/coverImage.gif"
          )}
          alt="Christian Marques' Profile Picture"
          className={styles.coverImage}
          width={190}
          height={190}
          src="v1623788588/christianmarques.com/coverImage.gif"
        />
        <p>
          Hello and nice to meet you, my name is Christian and I'm a full time
          software engineer (full-stack Javascript), published poet, amateur
          musician, and hobbyist photographer.{" "}
        </p>
        <p>
          I graduated (B.Sc.) in Computer Science from the{" "}
          <a href="https://ciencias.ulisboa.pt/" target="_blank">
            Faculty of Sciences of the University of Lisbon
          </a>
          , and completed my M.Sc. in Information Systems in the same
          institution. I spent one full year in the{" "}
          <a href="https://www.upc.edu/en" target="_blank">
            Polytechnic Institute of Catalunya
          </a>{" "}
          (Barcelona) through the European interchange programme{" "}
          <a href="https://erasmusprogramme.com/" target="_blank">
            Erasmus Mundus
          </a>
          . I also worked for almost two years at the research laboratory{" "}
          <a
            href="https://www.linkedin.com/company/labmag---laboratory-of-agent-modelling/about/"
            target="_blank"
          >
            LabMAG
          </a>{" "}
          (Laboratório de Modelação de Agentes), where after delivering my
          thesis, I continued working on project{" "}
          <a href="http://naadir.fa.utl.pt/" target="_blank">
            NAADIR
          </a>
          .{" "}
        </p>
        <p>
          I am interested in topics as wide as web development, computer
          graphics, video-game design, crypto-currency/fintech, artificial
          intelligence, data science, artificial life, literature, cinema, music
          and philosophy.{" "}
        </p>
        <p>
          I have worked in various types of organization (academic,
          multinational, startup, etc) and am currently working at{" "}
          <a href="https://www.promaton.com" target="_blank">
            Promaton
          </a>
          , where I find a fulfilling day-by-day, complete with a purposeful
          mission, amazing company culture, fast development and a lot of
          growth, trying to innovate dental care with AI-Driven 3D
          Visualizations. I often volunteer for projects that might have some
          meaning to me, but I am also open to provide services as a contractor
          - mostly for web projects, but also video-games, or others, so if you
          have a project that you think would be interesting to discuss, do get
          in touch and we can talk about it.
        </p>
        <div className={styles.columns}>
          <details>
            <summary>Certifications</summary>
            <p>- Advanced C++ Concepts</p>
            <p>- Advanced Python Programming</p>
            <p>- Complete Android N Developer</p>
            <p>- Live-Media & Pure Data</p>
            <p>- Amadeus Open Back-End</p>
            <p>- Oracle Database 11g: SQL Tuning</p>
            <p>- React 16 Complete</p>
          </details>

          <details>
            <summary>Volunteering</summary>
            <p>- Cultura no Muro</p>
            <p>- VolNepal</p>
            <p>- EPIA 2011</p>
            <p>- FCUL</p>
          </details>
          <details>
            <summary>Languages</summary>
            <p>- English</p>
            <p>- Portuguese</p>
            <p>- French</p>
            <p>- Spanish</p>
            <p>- Italian</p>
          </details>
        </div>
        <p>
          I am a big fan of Tom Waits, L.W. Beethoven, Andrei Tarkovsky,
          Hidetaka and Hayao Miyazaki, Kurt Vonnegut, William Burroughs, José
          Afonso, Hideo Kojima, Byung-Chul Han, Carlos Paredes, Masunobu
          Fukuoka, Terrence McKenna, Alejandro Jodorowsky, The Beatles, Paul
          Thomas Anderson, Joaquin Phoenix, Nick Cave and the Bad Seeds,
          Dinosaur Jr., Werner Herzog, George Orwell, Stanley Kubrick, Charles
          Bukowski, Orson Welles, among many many many others that make one
          proud of being a human.
        </p>
        <br />
        <br />
        <br />
      </div>
    </div>
  );
}

export const getStaticProps = async () => {
  return {
    props: {},
  };
};
