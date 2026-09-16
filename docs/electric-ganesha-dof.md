# Particle depth of field

`ganeshaDof.js` uses Three r174's TSL DepthOfFieldNode and PostProcessing.
The original hidden-model depth pass remains unchanged for particle occlusion.
A separate particle pass records positive view-space depth using the exact same
animated vertex graph, disc alpha and visibility as the visible particles.
It writes the nearest visible disc depth without transparent blending.

The color pass and particle depth feed the DOF node. HTML is outside this
pipeline and stays sharp. No lights, colored materials or visible model meshes
are added. Focus tracks camera distance and model depth automatically.

Tune under `/#debug` → Depth of field, or in ganeshaConfig.js:
- dofFocusOffset: offset from the sculpture centre; negative focuses closer.
- dofAperture: defocus strength; zero bypasses both extra passes.
- dofMaxBlur: screen-space blur cap; zero also bypasses the effect.

Defaults: focus offset -0.25, aperture 0.002, maximum blur 0.003.
Mobile caps blur at 0.002. Reduced motion keeps static focus without autofocus
or extra animation. Targets follow the existing responsive DPR limits.

Cost: one extra particle draw, one fullscreen multi-sample blur, and two viewport
render targets (color and float depth). This is approximate depth of field for
transparent discs: nearest visible particle depth wins; it is not a physical
multi-layer lens simulation. Empty white pixels are assigned focus-plane depth
to avoid broad silhouette halos. Set aperture to zero on constrained devices.
