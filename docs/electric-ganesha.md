# Electric Ganesha

The existing homepage remains DOM content over a fixed white Three.js canvas.
One visible `THREE.Points` object interpolates between a noise-driven abstract field and
sampled Ganesha surface positions. No source mesh is added to the visible scene. A separate offscreen packed-depth
pass resolves which sampled points are hidden by the front surface; it is never
composited as a mesh image. Source PBR material loading is bypassed by a GLTFLoader plugin. The base-color
image is decoded only for CPU brightness sampling.
There are no lights, PBR materials, or additional runtime dependencies. Opt-in
audio is documented in `electric-ganesha-music.md`.

## Files

- `components/WebGLSnippet/index.js`: existing renderer lifecycle evolved to use
  the particle buffers, throttled surface raycasts, eased reveal/parallax,
  passive pointer events, reduced motion, responsive counts and cleanup.
- `components/WebGLSnippet/sampleGanesha.js`: geometry loading, normalization, CPU texture-ink sampling and
  deterministic area-weighted surface sampling.
- `components/WebGLSnippet/ganeshaConfig.js`: artistic and performance controls.
- `components/WebGLSnippet/DynamicWebGL.jsx`: allows the static particle composition
  for reduced motion and forwards the optional interaction callback. Existing
  Data Saver, low-core-device and WebGL fallback policies remain.
- `components/WebGLSnippet/WebGLSnippet.module.scss`: canvas ignores DOM pointer
  targeting so touch scrolling and HTML controls retain normal behavior.
- `shaders/ganesha/noise.glsl`: noise function reused from the original circle shader.
- `shaders/ganesha/stipple.glsl`: directional ink coverage, contour emphasis and
  16-tap screen-space cavity approximation.
- `shaders/ganesha/vertex.glsl`: field motion, per-particle reveal, true normal
  displacement, perspective size and visibility.
- `styles/Home.module.scss`: narrower desktop title strip and smaller heading.
- `shaders/ganesha/fragment.glsl`: antialiased monochrome circular discs.
- `scripts/test-ganesha.mjs`: real GLB and transformed multi-mesh sampling checks.
- `scripts/test-ganesha-browser.cjs`: optional browser regression checks.

The original `shaders/sphere` files remain available. Homepage content, navigation
and fonts remain; the desktop title and its strip are resized to expose the form.

## Model and sampling

The supplied GLB is 2,199,312 bytes, with a root and one mesh child, 24,921 vertices,
34,098 triangles, UVs, an embedded image and no normals. It is upright and faces
+Z, toward the existing camera. No orientation correction is needed.

The loader traverses all visible mesh descendants, bakes their world transforms,
computes missing normals, removes unused vertex attributes, and merges the
triangle surfaces. It recenters the combined bounds and scales the result to
2 world units tall. MeshSurfaceSampler then samples the merged geometry by triangle
area with additional configurable front/face weights. Larger transformed surfaces
receive proportionally more points within each weighted region. The sampler returns triangle normals, then barycentric interpolation replaces
them with smooth vertex normals; these are stored with each surface position,
normalized field position and deterministic seed in GPU attributes. Sampling is
performed once at load and when crossing the mobile breakpoint, never per frame.
Static mesh geometry is supported; animated skinning/morph poses are not baked.

## Tuning

Edit `components/WebGLSnippet/ganeshaConfig.js`:

| Appearance | Controls |
| --- | --- |
| Sculpture size | `scale`, `mobileScale` |
| Position | `xOffset`, `yOffset`, `depth` |
| Base orientation (radians) | `rotationX`, `rotationY`, `rotationZ` |
| Framing | `cameraDistance`, `mobileCameraDistance` |
| Density | `particleCountDesktop` (60,000), `particleCountMobile` (20,000) |
| Resting visibility | `idleReveal` (0.56), `reducedMotionReveal` (0.72) |
| Interaction reveal | `hoverReveal`, `pressedReveal`, `pointerRevealStrength` |
| Pointer radius (normalized model units) | `interactionRadius` (0.58) |
| Surface breathing/ripple amplitude | `displacementStrength` (0.022) |
| Parallax (radians) | `pointerRotationStrength` (0.105), `idleRotationStrength` |
| Circle sizes (CSS pixels before variation/perspective) | `fieldParticleSize`, `surfaceParticleSize` |
| Render resolution | `maxDpr` (2), `mobileMaxDpr` (1.5) |
| CPU query rate | `raycastInterval` (0.066 seconds) |

Per-particle threshold distributions live together in `vertex.glsl`. `coreFraction`
(0.9) preserves coherent surface landmarks; the outer population still interpolates
through the abstract field. `frontSamplingWeight` (4) and `faceSamplingWeight` (3.5)
concentrate detail on the face and front, while retaining samples on every side.
`fieldCountDesktop` (180) and `fieldCountMobile` (80) control the sparse large circles.
The invisible depth pass suppresses rear surfaces without illumination and samples
at each disc's center so circles retain complete, unclipped edges.

Desktop title size and white strip height in `styles/Home.module.scss` are reduced
toward the supplied concept's proportions, exposing more of the trunk. DOM content,
fonts, centered positioning, navigation and controls remain unchanged.

## Stipple shading

Particle size now follows geometry rather than mostly random seeds. A fixed
camera-space ink direction creates a white highlight side and darker turning
surfaces. Grazing-angle normals strengthen the outer contour. Sixteen neighboring
depth samples estimate cavities: nearby geometry above the surface tangent plane
adds ink around folds and overlapping forms. This is a screen-space approximation,
not physically accurate ambient occlusion or cast shadows.

Only black discs are visible. Highlights use smaller discs and more paper space;
shadow areas use larger discs. Small random variation remains to avoid a mechanical
halftone. The existing depth pass supplies visibility and cavity information, so
there are still two draw calls. No visible mesh, PBR material, light object, colored texture,
color gradient or additional render target is introduced.

Tune these in `ganeshaConfig.js`:

- `inkDirection`: camera-space direction toward the highlight side.
- `shadowStrength`: directional tonal contrast.
- `contourStrength`: silhouette emphasis.
- `occlusionStrength` / `occlusionRadius`: darkness and neighborhood size of folds.
- `inkSizeRange`: highlight/shadow disc-size multipliers.

Sampled normals are barycentrically interpolated from smooth vertex normals instead
of using the r142 sampler's default flat triangle normals. This keeps tonal bands
continuous across curved surfaces. The extra sixteen depth lookups are per vertex,
not per screen fragment, at two radii (fine creases and broad overlaps), with no CPU particle frame updates.

## Interaction and future audio hook

Window pointer listeners remain passive and never capture pointers or prevent
scrolling. The screen pointer and interaction point are damped every frame using
`pointerSmoothing` (12/second). Throttled surface raycasts only update the target
depth; `depthSmoothing` (5/second) eases it and retains the last depth across empty
space. Projecting the continuous pointer onto that moving depth plane avoids jumps
between the trunk, ears and silhouette gaps. The resulting point is converted into
model space before the shader's broad Gaussian falloff and normal displacement.
Proximity and global reveal are continuous, rather than gated by a mesh hit boolean.
No particles are raycast or updated individually on the CPU.

`<DynamicWebGL onInteraction={handler} />` optionally emits a snapshot at up to
15 Hz: `{ position: [x,y,z], normalizedPosition: [x,y,z], region, intensity }`.
Position is centered model space; normalizedPosition is clamped to [0,1] within
model bounds. Region is lower/middle/upper and intensity is [0,1], zero when inactive.
The callback remains available. The opt-in engine now also consumes the same
smoothed coordinates; see `electric-ganesha-music.md`.

## Performance and accessibility

One particle draw call plus one offscreen depth draw, GPU-only particle animation,
60k/20k samples, capped DPR,
and rendering paused when the hero is offscreen or the tab is hidden. The original
per-frame CPU hover loop and repeated attribute uploads are removed. Exact mesh
raycasts against 34k triangles are capped at 15 Hz; raycast intersections still
allocate internally in Three.js. If a future model is much denser, use a separate
simplified interaction proxy or BVH rather than raising this rate.

Reduced motion freezes noise/ripples and idle rotation and starts with a static,
partially revealed composition. Only subtle pointer parallax and reveal remain.
Model/network/WebGL failure retains the existing static circle fallback. Data
Saver and the existing low-core capability gate avoid loading the model entirely.
The GLB download still includes its embedded image bytes, with the image now decoded once for ink sampling; an offline geometry-only GLB would reduce bandwidth further.

Three.js r142/WebGL is retained. WebGPU/TSL would require a renderer/dependency
migration; it is unnecessary for these two draw calls and would expand the scope.

## Verification

- `node scripts/test-ganesha.mjs`: normalization, finite unit normals, deterministic
  buffers, and a synthetic multi-mesh GLB with a 1:4 transformed area ratio.
- Browser checks against `npm run dev`: desktop 1440×1000 and portrait 390×844,
  idle/hover/press screenshots, zero runtime or shader errors, no horizontal overflow.
- Touch emulation: scrolling works (325px test swipe); Explore button navigates.
- DPR 3 emulation: actual backing width is capped to 585px at CSS width 390px.
- Initial reduced-motion screenshots are byte-identical one second apart.
- Missing GLB returns the static fallback while preserving homepage content.
- Chrome mobile emulation: frame timing is printed by the browser regression script. This is not a physical-phone GPU benchmark.
- Formatting and isolated ESLint syntax/undefined-variable checks pass. The full
  repository ESLint command is blocked by the pre-existing missing `prettier`
  ESLint configuration dependency. A production export was not run.

Optional browser regression test (Playwright is not added to project dependencies):

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
CHROME_EXECUTABLE=/absolute/path/to/chrome \
node scripts/test-ganesha-browser.cjs
```

Omit those variables if Playwright and its Chromium are installed normally.
Set `GANESHA_PREVIEW_URL` to test a preview other than http://localhost:3000.

### Higher-detail rendering

The visible particle counts are now 60k desktop / 20k mobile, with smaller 2.1px
base discs and a more stable surface core. This exceeds the original rough particle
budget to prioritize the requested detail. Desktop DPR is capped at 2; mobile stays
at 1.5. The offscreen depth target follows the same backing resolution, and a tighter
visibility tolerance reduces bleed-through between adjacent surfaces. Field circles
are suppressed over the sculpture's projected silhouette to preserve facial detail.
Browser regression output includes an interacting 1440×1000 DPR-2 desktop frame
timing run in addition to the existing mobile emulation checks. Physical-device
performance still needs verification.

### Texture-informed ink

The loader now decodes base-color images without creating source PBR materials.
It retains UVs and a per-mesh image index through normalization and merging.
Surface sampling interpolates UVs barycentrically at each particle, samples image
brightness bilinearly on the CPU, and stores a single `aTextureInk` scalar. UV
transforms, wrapping and flip orientation are applied; sampled UVs are retained
in the particle buffer. Missing/failed images use a -1 sentinel and fall back to
geometry shading. The image is not uploaded to the visible shader.

`textureInkBlend` (0.65) mixes geometry tone with texture brightness: 0 reproduces
geometry-only shading and 1 uses texture brightness only. `textureInkContrast`
(1.2) controls texture contrast. The fragment shader still emits black only; the
extra signal changes disc sizes. No particle count or draw-call increase occurs.
Original photographed shadows may remain in the ink signal, so the default blend
retains some geometry shading rather than reproducing the photographed material.
The decoded atlas is retained on the surface for responsive resampling; the shipped
1024×1024 atlas adds approximately 4MB of CPU pixel storage, plus one float per
particle for ink and retained UVs. No per-frame CPU image sampling is performed.

Tests cover image orientation, bilinear interpolation, varying UV-derived ink,
unchanged surface positions, and the missing-image sentinel. Browser regressions
also treat texture decoding warnings as failures for the supplied GLB.

## Hidden debugger and deliberate interaction

Open `/#debug` to load the debug panel; it is absent for ordinary URLs. All numeric
artistic/performance settings and vector components have controls. Uniform and
transform changes apply live. Particle counts and sampling weights are staged
until **Apply particle settings**, avoiding repeated rebuilds while dragging.
**Reset** restores source defaults; **Copy config** exports JSON (including pending
sampling edits). Changes are session-only and disappear on reload. `modelUrl` is
shown read-only. A preview-state selector holds rest/hover/full reveal for tuning
without keeping the pointer over the sculpture. Closing the panel restores live
interaction. Controls are keyboard accessible and the mobile panel scrolls internally.

The resting reveal is now 0.24 and ordinary hover reaches 0.52 globally, with
stronger local reveal. The coherent surface fraction grows with reveal rather than
staying permanently dense. Hover gathers gradually (`hoverDwell`); movement leaves
six short-lived model-space trail samples (`trailDuration`, `trailRevealStrength`).
A primary-button/touch hold builds intent over `holdDuration` (2.8s), revealing the
whole form and emitting restrained traveling normal-displacement pulses. Pulse
strength/speed are configurable. Release intent decays over `releaseDuration`
(3.5s), followed by eased settling of the global reveal. Pointer cancellation,
scrolling, blur and leaving reset the pressed state. HTML controls and the debug
panel do not activate the effect. No pointer capture or scroll prevention is used.
Reduced motion disables trails and traveling ripples, retaining gentle reveal.

Changed files for this iteration: `GaneshaDebug.jsx`, `GaneshaDebug.module.scss`,
`index.js`, `ganeshaConfig.js`, `shaders/ganesha/vertex.glsl`, browser regression
scripts and this document. `scripts/test-ganesha-debug.cjs` uses the same Playwright
and Chrome environment variables as the main browser test. It validates hash
activation, live GPU updates, staged sampling, copy/reset, preview modes and mobile
bounds. The main browser test additionally verifies hold/release intent and pulses.

Reveal timing: `hoverDwell` is 1.4 seconds, `holdDuration` is 2.8 seconds, and
`revealDuration` is a 1.2-second exponential easing time constant (not a hard
completion deadline). All are adjustable under Interaction in `#debug`. Pointer
position smoothing and release duration remain unchanged.

### Return to field on inactivity

A stationary cursor no longer sustains the sculpture. `idleDelay` (1.2s) gives a
short pause before `idleFadeDuration` (1.8s) fades pointer activity; existing reveal
and trail easing then disperse the form. Press-and-hold deliberately stays active.
The default `idleReveal` is now zero, and both the coherent surface core and the
field's silhouette suppression fade completely, avoiding a residual statue outline
or statue-shaped gap. Reduced-motion mode retains its static composition. The debug
panel exposes both inactivity timings under Interaction; forced preview states still
hold their selected reveal. The regression test leaves the pointer over Ganesha
after release and verifies that activity and reveal decay back to the field.

The later musical iteration adds opt-in synthesis, temporary drag sequences, and
monochrome audiovisual feedback. See [musical interaction](electric-ganesha-music.md).
