import styles from "../styles/Home.module.scss";
import { useEffect, useState } from "react";

export default function Home() {

  const [isCanvasCreated, setIsCanvasCreated] = useState(false);

  useEffect(() => {
    if (isCanvasCreated) {
      return;
    }

    const p5 = require("p5");
    new p5((p) => {
      const pointArray = Array.from(Array(2), () => new Array(4));

      function redraw() {
        const width = p.select("#canvas").width - 13;
        const height = p.select("#canvas").height;
        p.createCanvas(width, height);
        setIsCanvasCreated(true);
        p.clear();
        p.background("white");
        p.stroke("black");

        for (let i = 0; i < width / 4; i++) {
          for (let j = 0; j < height / 4; j++) {
            pointArray[(i, j)] = 14 - p.sq(j / 6);
            p.strokeWeight(pointArray[(i, j)]);
            p.point((i + 1) * 20, (j + 1) * 20);
          }
        }
      }

      p.setup = () => {
        redraw();
      };
      p.windowResized = () => {
        const width = p.select("#canvas").width;
        const height = p.select("#canvas").height;
        p.resizeCanvas(width, height, true);
        redraw();
      };

      p.draw = () => {};
    }, "canvas");
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <img src="/hexagram55.png" alt="Hexagram 55" />
        Christian Marques
        <img src="/hexagram55.png" alt="Hexagram 55" />
      </h1>
      <div id="canvas" className={styles.canvas} />
    </div>
  );
}
