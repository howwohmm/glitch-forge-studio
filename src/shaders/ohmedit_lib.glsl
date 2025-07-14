
// Ohmedit GLSL Helper Library
// Based on functions from "The Book of Shaders"

// 1.1 Random and Noise Functions

// 2D pseudo-random function (page 107)
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D value noise function (page 115)
float noise(in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    // Smooth Interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    // Mix 4 corners percentages
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion function (page 123)
float fbm(in vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    // Loop of octaves
    for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// 1.2 Color Space Conversion

// HSB to RGB conversion (page 51)
vec3 hsb2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// 1.3 Procedural Shapes (Signed Distance Functions)

// Circle SDF (pages 68-70)
float circleSDF(vec2 st, float radius) {
    vec2 dist = st - vec2(0.5);
    return 1.0 - smoothstep(radius - (radius * 0.01), radius + (radius * 0.01), dot(dist, dist) * 4.0);
}

// Box SDF (pages 58-60)
float boxSDF(vec2 st, vec2 size) {
    size = vec2(0.5) - size * 0.5;
    vec2 uv = smoothstep(size, size + vec2(0.001), st);
    uv *= smoothstep(size, size + vec2(0.001), vec2(1.0) - st);
    return uv.x * uv.y;
}

// Polygon SDF (page 78)
float polygonSDF(vec2 st, int sides) {
    st = st * 2.0 - 1.0;
    float a = atan(st.x, st.y) + 3.14159;
    float r = 6.28318 / float(sides);
    return cos(floor(0.5 + a / r) * r - a) * length(st);
}

// 1.4 Matrix Transformations

// 2D rotation matrix (page 83)
mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

// 2D scaling matrix (page 86)
mat2 scale(vec2 scale_amount) {
    return mat2(scale_amount.x, 0.0, 0.0, scale_amount.y);
}

// 1.5 Photoshop Blending Modes (pages 144-148)

vec3 blendMultiply(vec3 base, vec3 blend) {
    return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), step(0.5, base));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return mix(2.0 * base * blend + base * base * (1.0 - 2.0 * blend), 
               sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend), 
               step(0.5, blend));
}

vec3 blendDifference(vec3 base, vec3 blend) {
    return abs(base - blend);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
    return mix(min(base / (1.0 - blend), 1.0), 1.0, step(1.0, blend));
}
