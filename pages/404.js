import Navbar from "../components/Navbar/Navbar";
import styles from "../styles/404.module.scss";

export default function FourOhFour() {
  return (
    <div className={styles.wrapper}>
      <Navbar />
      <div className={styles.fourOhFour}>
        <h1>Woops, sorry - that page does not exist</h1>
      </div>
    </div>
  );
}
