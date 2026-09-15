import * as THREE from "three/webgpu";
import { GANESHA_CONFIG } from "../components/WebGLSnippet/ganeshaConfig.js";
import { readFile } from "fs/promises";
import { pathToFileURL } from "url";
import path from "path";

function resolveImports(code) {
  return code.replace(/from "(three[^"\n]*)"/g, (_, name) => {
    let file;
    if (name === "three") file = "three/build/three.module.js";
    else if (name === "three/webgpu") file = "three/build/three.webgpu.js";
    else if (name === "three/tsl") file = "three/build/three.tsl.js";
    else file = `${name}.js`;
    return `from "${pathToFileURL(path.resolve("node_modules", file))}"`;
  });
}

let depth = await readFile(
  new URL("../components/WebGLSnippet/utils/tslDepth.js", import.meta.url),
  "utf8"
);
const depthUri = `data:text/javascript;base64,${Buffer.from(resolveImports(depth)).toString("base64")}`;

let noise = await readFile(
  new URL("../components/WebGLSnippet/utils/tslNoise.js", import.meta.url),
  "utf8"
);
const noiseUri = `data:text/javascript;base64,${Buffer.from(resolveImports(noise)).toString("base64")}`;

let fieldMotion = await readFile(
  new URL("../components/WebGLSnippet/utils/fieldMotion.js", import.meta.url),
  "utf8"
);
const fieldMotionUri = `data:text/javascript;base64,${Buffer.from(resolveImports(fieldMotion)).toString("base64")}`;

let infl = await readFile(
  new URL("../components/WebGLSnippet/utils/tslInfluence.js", import.meta.url),
  "utf8"
);
infl = resolveImports(infl);
infl = infl.replace('from "./tslNoise"', `from "${noiseUri}"`);
infl = infl.replace('from "./fieldMotion"', `from "${fieldMotionUri}"`);
const inflUri = `data:text/javascript;base64,${Buffer.from(infl).toString("base64")}`;

let src = await readFile(
  new URL("../components/WebGLSnippet/ganeshaMaterial.js", import.meta.url),
  "utf8"
);
src = resolveImports(src);
src = src.replace('from "./utils/tslDepth"', `from "${depthUri}"`);
src = src.replace('from "./utils/tslInfluence"', `from "${inflUri}"`);

const dataUri = `data:text/javascript;base64,${Buffer.from(src).toString("base64")}`;
const { createGaneshaMaterial } = await import(dataUri);

const dummyTarget = new THREE.RenderTarget(1, 1);
const { material, uniforms } = createGaneshaMaterial(GANESHA_CONFIG, dummyTarget.texture);

console.log("PASS: createGaneshaMaterial executed cleanly with no ReferenceError!");
console.log("Material vertexNode present:", !!material.vertexNode);
console.log("Material opacityNode present:", !!material.opacityNode);
