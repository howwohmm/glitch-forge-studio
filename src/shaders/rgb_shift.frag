
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform vec2 u_amount;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.y = 1.0 - st.y; // Flip Y coordinate
    
    // Sample each channel with different offsets
    float r = texture2D(u_texture, st - u_amount).r;
    float g = texture2D(u_texture, st).g;
    float b = texture2D(u_texture, st + u_amount).b;
    
    gl_FragColor = vec4(r, g, b, 1.0);
}
