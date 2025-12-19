#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifndef PI
#define PI 3.141592653589793
#endif

uniform float time;
uniform float uSize;
uniform vec3 uMousePos;
uniform float uIsClicked;
attribute float scale;

varying float height;

void main() {
    float slowedTime = time * 0.2;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Calculate distance from mouse
    float distanceToMouse = distance(modelPosition.xyz, uMousePos);

    // Smoothly interpolate radius and strength based on click state for progressive animation
    float repelRadius = mix(400.0, 600.0, uIsClicked);
    float repelStrength = mix(25.0, 120.0, uIsClicked);

    // Apply organic repulsion force with easing and noise
    if(distanceToMouse < repelRadius) {
        vec3 direction = normalize(modelPosition.xyz - uMousePos);

        // Smooth easing curve for more organic movement
        float normalizedDist = distanceToMouse / repelRadius;
        float easedForce = pow(1.0 - normalizedDist, 3.0);

        // Add noise-based variation for erratic, organic movement
        float noiseX = sin(slowedTime * 0.5 + modelPosition.x * 0.01) * 0.5 + 0.5;
        float noiseY = cos(slowedTime * 0.7 + modelPosition.y * 0.01) * 0.5 + 0.5;
        float noiseZ = sin(slowedTime * 0.6 + modelPosition.z * 0.01) * 0.5 + 0.5;
        float noiseVariation = (noiseX + noiseY + noiseZ) / 3.0;

        // Combine easing with noise for unpredictable, organic feel
        float force = easedForce * repelStrength * (0.5 + noiseVariation * 0.5);

        // Apply force with perpendicular offset for swirling effect
        vec3 perpendicular = vec3(-direction.y, direction.x, direction.z * 0.5);
        float swirl = sin(slowedTime + distanceToMouse * 0.02) * 0.3;

        modelPosition.xyz += direction * force;
        modelPosition.xyz += perpendicular * force * swirl;
    }

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize += position.x / 32.0 * scale * uSize * sin(slowedTime * modelPosition.x * 0.005) * atan(slowedTime * modelPosition.x * 0.005) * cos(slowedTime * modelPosition.x * 0.005);
    gl_PointSize += position.y / 16.0 * scale * uSize * sin(slowedTime * modelPosition.y * 0.005) * atan(slowedTime * modelPosition.y * 0.005) * cos(slowedTime * modelPosition.y * 0.005);

    // Increase dot size on hover with smooth falloff
    float hoverRadius = 350.0;
    if(distanceToMouse < hoverRadius) {
        float normalizedHoverDist = distanceToMouse / hoverRadius;
        float sizeBoost = pow(1.0 - normalizedHoverDist, 2.0) * 50.0;
        gl_PointSize += sizeBoost;
    }

    height = gl_PointSize;
}
