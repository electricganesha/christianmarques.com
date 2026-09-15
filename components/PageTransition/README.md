# Native page dissolve with Electric Ganesha particles

Ordinary internal link clicks use `document.startViewTransition` around the
Next.js route update. The browser captures the rendered pages directly, preserving
font rasterization, image crops, filters and GPU compositing. There is no
html2canvas dependency or screenshot-to-texture conversion.

Global view-transition styles dissolve the native old/new captures through a
circular mask over 1200ms. A separately named `electric-particles` layer renders
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
