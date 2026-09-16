# Native page dissolve with Electric Ganesha particles

Ordinary internal link clicks use `document.startViewTransition` around the
Next.js route update. The browser captures the rendered pages directly, preserving
font rasterization, image crops, filters and GPU compositing. There is no
html2canvas dependency or screenshot-to-texture conversion.

Global view-transition styles crossfade native old/new captures over 1200ms.
Only opacity animates; radial masks and root capture-size interpolation are
disabled to reduce full-page compositing cost. A separately named `electric-particles` layer renders
live black instanced discs with the same restrained TSL flow as Ganesha. Layout
sampling only positions these bridging particles; it never redraws page content.

Tune DURATION in WebGLTransition.jsx together with the 1200ms native animation
rules in globals.scss. Particle size, opacity and flow are in transitionMaterial.js.

Reduced motion and browsers without native View Transitions use ordinary links.
Modified clicks, downloads, same-page links and external links keep native behavior.
Programmatic and browser-history navigation currently use normal Next navigation.
New clicks skip the previous visual transition. No animation loop runs when idle.

Validation: scripts/test-native-transition.cjs checks real link navigation and
reduced-motion bypass; scripts/test-page-transition.mjs checks TSL construction.

Each run regenerates particle seeds and chooses one bounded flow direction,
phase, scatter scale (0.7–1.5), and timing spread (0.06–0.16). These choices remain fixed
for the animation, so variation introduces no frame-to-frame random jitter.
Page and card durations remain unchanged.

Performance budget: 2800 particles for desktop pages, 1800 for desktop filters,
1100 on mobile. Overlay DPR caps at 1.25 desktop / 1 mobile, with shader disc
antialiasing instead of multisampling. Native captures retain full resolution.
Canvas resizing is skipped when viewport dimensions and DPR are unchanged.
