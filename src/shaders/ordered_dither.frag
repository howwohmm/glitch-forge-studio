
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform float u_threshold;
uniform float u_palette_size;

// 8x8 Bayer matrix
float bayerMatrix[64];

float getBayerValue(vec2 pos) {
    int x = int(mod(pos.x, 8.0));
    int y = int(mod(pos.y, 8.0));
    
    // Hardcoded 8x8 Bayer matrix values
    float matrix[64] = float[64](
        0.0, 32.0, 8.0, 40.0, 2.0, 34.0, 10.0, 42.0,
        48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
        12.0, 44.0, 4.0, 36.0, 14.0, 46.0, 6.0, 38.0,
        60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
        3.0, 35.0, 11.0, 43.0, 1.0, 33.0, 9.0, 41.0,
        51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
        15.0, 47.0, 7.0, 39.0, 13.0, 45.0, 5.0, 37.0,
        63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0
    );
    
    return matrix[y * 8 + x] / 64.0;
}

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.y = 1.0 - st.y; // Flip Y coordinate
    
    // Sample the texture
    vec4 color = texture2D(u_texture, st);
    
    // Convert to grayscale (luma)
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Get Bayer matrix value
    float bayerValue = getBayerValue(gl_FragCoord.xy);
    
    // Apply threshold
    float threshold = bayerValue * u_threshold;
    
    // Quantize to palette
    float quantized = floor(luma * u_palette_size + threshold) / u_palette_size;
    
    gl_FragColor = vec4(vec3(quantized), 1.0);
}
