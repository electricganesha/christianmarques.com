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
varying vec2 vAberrationOffset;

// Classic Perlin 3D Noise by Stefan Gustavson
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - D.yyy;      // 2.0*C.xxx = 1/3 = C.yyy

  // Permutations
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  // ( N*N points project uniformly on a line, double-odd grid)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    float slowedTime = time * 0.2;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Apply an organic, gentle floating/wavy idle movement using snoise
    float idleSpeedX = time * 0.15;
    float idleSpeedY = time * 0.17;
    float idleSpeedZ = time * 0.13;
    float waveX = snoise(vec3(position.xy * 0.001, idleSpeedX)) * 30.0;
    float waveY = snoise(vec3(position.xy * 0.001 + vec2(100.0), idleSpeedY)) * 30.0;
    float waveZ = snoise(vec3(position.xy * 0.0015 - vec2(100.0), idleSpeedZ)) * 20.0;

    modelPosition.x += waveX;
    modelPosition.y += waveY;
    modelPosition.z += waveZ;

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

    // Initialize point size with a slow, deep, high-amplitude breathing scale multiplier
    float breathingTime = time * 0.6;
    float breathingNoise = snoise(vec3(position.xy * 0.0012, breathingTime));
    
    // Normalize noise to [0.0, 1.0] and apply power easing to shape the breathing pattern
    float normalizedNoise = breathingNoise * 0.5 + 0.5;
    float breathingFactor = pow(normalizedNoise, 1.5) * 2.8 + 0.1;
    gl_PointSize = scale * uSize * 12.0 * breathingFactor;

    // Add back the original "grid-movement" wave animation using arctangents
    float sizeBoostX = position.x / 32.0 * scale * uSize * sin(slowedTime * modelPosition.x * 0.005) * atan(slowedTime * modelPosition.x * 0.005) * cos(slowedTime * modelPosition.x * 0.005);
    float sizeBoostY = position.y / 16.0 * scale * uSize * sin(slowedTime * modelPosition.y * 0.005) * atan(slowedTime * modelPosition.y * 0.005) * cos(slowedTime * modelPosition.y * 0.005);
    gl_PointSize += sizeBoostX + sizeBoostY;

    // Increase dot size on hover with smooth falloff
    float hoverRadius = 350.0;
    if(distanceToMouse < hoverRadius) {
        float normalizedHoverDist = distanceToMouse / hoverRadius;
        float sizeBoost = pow(1.0 - normalizedHoverDist, 2.0) * 50.0;
        gl_PointSize += sizeBoost;
    }

    // Calculate chromatic aberration offset based on interaction
    float interactionRadius = mix(400.0, 600.0, uIsClicked);
    float hoverStrength = 0.0;
    vec2 aberrationDir = vec2(0.0);
    if(distanceToMouse < interactionRadius) {
        float normalizedDist = distanceToMouse / interactionRadius;
        hoverStrength = pow(1.0 - normalizedDist, 2.0);
        vec3 dir = modelPosition.xyz - uMousePos;
        aberrationDir = normalize(dir.xy + vec2(0.0001));
    }

    float aberrationAmount = hoverStrength * 0.06 + uIsClicked * 0.08;
    if(length(aberrationDir) < 0.1) {
        aberrationDir = vec2(1.0, 1.0);
    }
    vAberrationOffset = normalize(aberrationDir) * aberrationAmount;

    height = gl_PointSize;
}
