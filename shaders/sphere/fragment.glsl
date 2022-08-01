uniform vec3 uColor;
varying float height;

void main() {
    if(length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475)
        discard;
    float transformedHeight = height / 200.;
    vec3 color = mix(uColor, vec3(1.0 * transformedHeight, 1.0 * transformedHeight, 1.0 * transformedHeight), transformedHeight);
    gl_FragColor = vec4(color, 1.0);
}
