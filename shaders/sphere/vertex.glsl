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
attribute float scale;

varying float height;

void main() {
    float slowedTime = time * 0.2;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize += position.x / 32.0 * scale * uSize * sin(slowedTime * modelPosition.x * 0.005) * atan(slowedTime * modelPosition.x * 0.005) * cos(slowedTime * modelPosition.x * 0.005);
    gl_PointSize += position.y / 16.0 * scale * uSize * sin(slowedTime * modelPosition.y * 0.005) * atan(slowedTime * modelPosition.y * 0.005) * cos(slowedTime * modelPosition.y * 0.005);
    height = gl_PointSize;
}
