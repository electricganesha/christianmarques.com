uniform vec3 uColor;
varying float height;
varying vec2 vAberrationOffset;

void main() {
    // Compute distance from shifted centers for each color channel to produce chromatic aberration
    float distR = length(gl_PointCoord - (vec2(0.5) - vAberrationOffset));
    float distG = length(gl_PointCoord - vec2(0.5));
    float distB = length(gl_PointCoord - (vec2(0.5) + vAberrationOffset));

    // Calculate a soft SDF glow for each channel with a smooth and organic power falloff
    float glowR = smoothstep(0.5, 0.35, distR);
    float glowG = smoothstep(0.5, 0.35, distG);
    float glowB = smoothstep(0.5, 0.35, distB);

    glowR = pow(glowR, 1.5);
    glowG = pow(glowG, 1.5);
    glowB = pow(glowB, 1.5);

    // Overall alpha is determined by the maximum channel glow
    float alpha = max(glowR, max(glowG, glowB));

    // Performance optimization: discard negligible fragments
    if(alpha < 0.005) {
        discard;
    }

    // Original height color mixing logic
    float transformedHeight = height / 200.0;
    vec3 cp = mix(uColor, vec3(transformedHeight), transformedHeight);

    // Compute blended outputs such that standard alpha blending over a white background
    // yields exactly the correct color and opacity for each individual color channel.
    gl_FragColor.r = 1.0 - (glowR / max(alpha, 0.0001)) * (1.0 - cp.r);
    gl_FragColor.g = 1.0 - (glowG / max(alpha, 0.0001)) * (1.0 - cp.g);
    gl_FragColor.b = 1.0 - (glowB / max(alpha, 0.0001)) * (1.0 - cp.b);
    gl_FragColor.a = alpha;
}
