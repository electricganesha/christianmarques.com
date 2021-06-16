import styles from "../styles/About.module.scss";

export default function About() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <img
          className={styles.coverImage}
          src="https://res.cloudinary.com/dhgkpiqzg/image/upload/v1623788588/christianmarques.com/coverImage.gif"
        />
        <p>
          Hello and nice to meet you, my name is Christian and I'm a full time
          software engineer (full-stack Javascript), published poet, amateur
          musician, and hobbyist photographer.{" "}
        </p>
        <p>
          I graduated (B.Sc.) in Computer Science from the Faculty of Sciences
          of the University of Lisbon, and completed my M.Sc. in Information
          Systems in the same institution. I spent one full year in the
          Polytechnic Institute of Catalunya (Barcelona) through the European
          interchange programme Erasmus Mundus. I also worked for almost two
          years at the research laboratory LabMAG (Laboratório de Modelação de
          Agentes), where after delivering my thesis, I continued working on
          project NAADIR.{" "}
        </p>
        <p>
          I am interested in topics as wide as web development, computer
          graphics, video-game design, crypto-currency/fintech, artificial
          intelligence, data science, artificial life, literature, cinema, music
          and philosophy.{" "}
        </p>
        <p>
          I have worked in various types of organization (academic,
          multinational, startup, etc) and am currently working at Trouva, where
          I find a fulfilling day-by-day, complete with a purposeful mission,
          fast development and a lot of growth. I often volunteer for projects
          that might have some meaning to me, but I am also open to provide
          services as a contractor - mostly for web projects, but also
          video-games, or others, so if you have a project that you think would
          be interesting to discuss, do get in touch and we can talk about it.
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
