# WebGPU / TSL recovery

The active renderer is `WebGPURenderer` from Three.js r174. All live shader math is
TSL in `components/WebGLSnippet/ganeshaMaterial.js`; the depth pass is also a
node material. The retained GLSL files are historical references, not imported by
the active renderer. The renderer can compile the same TSL for WebGL2 when WebGPU
is unavailable; there is no separate legacy ShaderMaterial path.

The incomplete migration had scalar uniform nodes holding arrays, an inconsistent
linear-depth writer/perspective-depth reader, point primitives unsuitable for
programmable WebGPU particle sizing, and incorrect projected texture coordinates.
The repaired version uses `uniformArray` (CPU edits `.array`, not its padded
`.value` GPU storage), instanced camera-facing quads, float linear view depth with
a matching reader, and clip-to-TSL texture Y conversion. Quad UVs are independent
of sampled model UVs. Abstract field coordinates stay in world space while surface
targets follow the model transform.

Sampling, UI, damped pointer interaction, slow reveal/release, audio lifecycle and
the #debug panel remain in the existing architecture. No visible polygon model.
The read-only `document.querySelector('#canvas').ganeshaSnapshot()` diagnostic
returns state only under #debug; `data-renderer` identifies the actual backend.
Browser tests use that interface instead of intercepting legacy WebGL uniforms.

Trade-off: quads run vertex work four times per particle, and float RGBA depth
uses more memory than the old byte-packed target. Counts and DPR remain capped.
Desktop and 390×844 Chrome tests confirmed WebGPU, continuous interaction,
stationary dissolution, touch scrolling and static reduced-motion output.
Physical phone/Safari performance is not established by emulation.

References: [official TSL reference](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language),
project `.claude/skills/webgpu-threejs-tsl/SKILL.md`, and the installed r174 source
(the current online documentation can describe APIs newer than this project).

## Mobile gesture ownership

On coarse-pointer devices, a transparent hero play area owns one-finger drags via
CSS `touch-action: pinch-zoom` and pointer capture. It starts below the navigation,
leaves 24px side gutters, and ends 160px above the initial viewport bottom. It is
positioned in document space, so it scrolls away with the hero. The area is added
only after renderer initialization and removed with the component/fallback.

The hint explains that swiping below the play area scrolls. Gutters, lower hero,
Explore, sound controls and navigation retain normal behavior; pinch zoom is not
prevented. Touches originating outside the play area do not become musical while
scrolling across it. Desktop hit testing is unchanged. Primary-pointer filtering
and pointer capture keep an active drag stable when it crosses an area boundary;
release/cancel still ends the interaction.

`node scripts/test-ganesha-touch-browser.cjs` uses real CDP touch events at 390×844
to verify zero scroll while playing, continuous shader input, capture/release,
lower-hero scrolling and Explore navigation. Physical Safari/iOS remains untested.
