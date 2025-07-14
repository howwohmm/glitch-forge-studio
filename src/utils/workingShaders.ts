export interface WorkingShader {
  id: string;
  name: string;
  category: 'crt' | 'blur' | 'color' | 'pixel' | 'special';
  complexity: 'low' | 'medium' | 'high';
  description: string;
  vertexShader: string;
  fragmentShader: string;
  uniforms: Array<{
    name: string;
    label: string;
    type: 'float' | 'vec2' | 'vec3' | 'vec4' | 'int' | 'bool';
    default: any;
    min?: number;
    max?: number;
    step?: number;
  }>;
  isMobileCompatible: boolean;
  needsTexture: boolean;
}

const basicVertexShader = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}`;

export const WORKING_SHADERS: WorkingShader[] = [
  // CRT Effects
  {
    id: 'crt-lottes',
    name: 'CRT Lottes',
    category: 'crt',
    complexity: 'medium',
    description: 'High-quality CRT simulation with phosphor bloom and curvature',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_scanlineIntensity;
uniform float u_curvature;
uniform float u_brightness;
varying vec2 v_texcoord;

vec2 warp(vec2 pos) {
    pos = pos * 2.0 - 1.0;
    pos *= vec2(1.0 + (pos.y * pos.y) * u_curvature, 1.0 + (pos.x * pos.x) * u_curvature);
    return pos * 0.5 + 0.5;
}

void main() {
    vec2 warped_coord = warp(v_texcoord);
    
    if (warped_coord.x < 0.0 || warped_coord.x > 1.0 || warped_coord.y < 0.0 || warped_coord.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }
    
    vec3 color = texture2D(u_texture, warped_coord).rgb;
    
    // Scanlines
    float scanline = sin(warped_coord.y * u_resolution.y * 3.14159);
    scanline = mix(1.0, scanline * 0.5 + 0.5, u_scanlineIntensity);
    
    color *= scanline * u_brightness;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_scanlineIntensity', label: 'Scanline Intensity', type: 'float', default: 0.5, min: 0.0, max: 1.0, step: 0.01 },
      { name: 'u_curvature', label: 'Curvature', type: 'float', default: 0.02, min: 0.0, max: 0.1, step: 0.001 },
      { name: 'u_brightness', label: 'Brightness', type: 'float', default: 1.0, min: 0.5, max: 2.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },
  
  {
    id: 'simple-scanlines',
    name: 'Simple Scanlines',
    category: 'crt',
    complexity: 'low',
    description: 'Basic scanline effect for retro look',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_intensity;
varying vec2 v_texcoord;

void main() {
    vec3 color = texture2D(u_texture, v_texcoord).rgb;
    
    float scanline = sin(v_texcoord.y * u_resolution.y * 3.14159 * 2.0);
    scanline = scanline * 0.5 + 0.5;
    scanline = mix(1.0, scanline, u_intensity);
    
    gl_FragColor = vec4(color * scanline, 1.0);
}`,
    uniforms: [
      { name: 'u_intensity', label: 'Intensity', type: 'float', default: 0.3, min: 0.0, max: 1.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  {
    id: 'crt-aperture',
    name: 'CRT Aperture',
    category: 'crt',
    complexity: 'low',
    description: 'Simulates CRT shadow mask pattern',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_maskStrength;
uniform float u_phosphorScale;
varying vec2 v_texcoord;

void main() {
    vec3 color = texture2D(u_texture, v_texcoord).rgb;
    
    vec2 pixel = v_texcoord * u_resolution * u_phosphorScale;
    
    // Shadow mask pattern
    vec3 mask = vec3(1.0);
    float x = fract(pixel.x / 3.0);
    if (x < 0.33) mask.r = 1.0 - u_maskStrength;
    else if (x < 0.66) mask.g = 1.0 - u_maskStrength;
    else mask.b = 1.0 - u_maskStrength;
    
    gl_FragColor = vec4(color * mask, 1.0);
}`,
    uniforms: [
      { name: 'u_maskStrength', label: 'Mask Strength', type: 'float', default: 0.3, min: 0.0, max: 1.0, step: 0.01 },
      { name: 'u_phosphorScale', label: 'Phosphor Scale', type: 'float', default: 1.0, min: 0.5, max: 3.0, step: 0.1 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  // Blur Effects
  {
    id: 'gaussian-blur',
    name: 'Gaussian Blur',
    category: 'blur',
    complexity: 'low',
    description: 'Smooth Gaussian blur effect',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_blurSize;
uniform vec2 u_direction;
varying vec2 v_texcoord;

void main() {
    vec2 texelSize = u_blurSize / u_resolution;
    vec3 color = vec3(0.0);
    
    // 9-tap Gaussian
    color += texture2D(u_texture, v_texcoord - 4.0 * texelSize * u_direction).rgb * 0.05;
    color += texture2D(u_texture, v_texcoord - 3.0 * texelSize * u_direction).rgb * 0.09;
    color += texture2D(u_texture, v_texcoord - 2.0 * texelSize * u_direction).rgb * 0.12;
    color += texture2D(u_texture, v_texcoord - 1.0 * texelSize * u_direction).rgb * 0.15;
    color += texture2D(u_texture, v_texcoord).rgb * 0.18;
    color += texture2D(u_texture, v_texcoord + 1.0 * texelSize * u_direction).rgb * 0.15;
    color += texture2D(u_texture, v_texcoord + 2.0 * texelSize * u_direction).rgb * 0.12;
    color += texture2D(u_texture, v_texcoord + 3.0 * texelSize * u_direction).rgb * 0.09;
    color += texture2D(u_texture, v_texcoord + 4.0 * texelSize * u_direction).rgb * 0.05;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_blurSize', label: 'Blur Size', type: 'float', default: 5.0, min: 0.0, max: 20.0, step: 0.1 },
      { name: 'u_direction', label: 'Direction', type: 'vec2', default: [1.0, 0.0] }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  {
    id: 'radial-blur',
    name: 'Radial Blur',
    category: 'blur',
    complexity: 'medium',
    description: 'Blur radiating from center point',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_center;
uniform float u_strength;
uniform float u_samples;
varying vec2 v_texcoord;

void main() {
    vec2 toCenter = u_center - v_texcoord;
    float distance = length(toCenter);
    
    vec3 color = vec3(0.0);
    float sampleCount = u_samples;
    
    for (float i = 0.0; i < 16.0; i++) {
        if (i >= sampleCount) break;
        
        float factor = i / sampleCount;
        vec2 offset = toCenter * factor * u_strength * distance;
        color += texture2D(u_texture, v_texcoord + offset).rgb;
    }
    
    color /= sampleCount;
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_center', label: 'Center', type: 'vec2', default: [0.5, 0.5] },
      { name: 'u_strength', label: 'Strength', type: 'float', default: 0.1, min: 0.0, max: 0.5, step: 0.01 },
      { name: 'u_samples', label: 'Samples', type: 'float', default: 8.0, min: 4.0, max: 16.0, step: 1.0 }
    ],
    isMobileCompatible: false,
    needsTexture: true
  },

  // Color Effects
  {
    id: 'color-adjust',
    name: 'Color Adjustment',
    category: 'color',
    complexity: 'low',
    description: 'Adjust brightness, contrast, saturation and gamma',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_gamma;
varying vec2 v_texcoord;

void main() {
    vec3 color = texture2D(u_texture, v_texcoord).rgb;
    
    // Brightness
    color += u_brightness;
    
    // Contrast
    color = (color - 0.5) * u_contrast + 0.5;
    
    // Saturation
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, u_saturation);
    
    // Gamma
    color = pow(color, vec3(1.0 / u_gamma));
    
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
    uniforms: [
      { name: 'u_brightness', label: 'Brightness', type: 'float', default: 0.0, min: -0.5, max: 0.5, step: 0.01 },
      { name: 'u_contrast', label: 'Contrast', type: 'float', default: 1.0, min: 0.0, max: 3.0, step: 0.01 },
      { name: 'u_saturation', label: 'Saturation', type: 'float', default: 1.0, min: 0.0, max: 2.0, step: 0.01 },
      { name: 'u_gamma', label: 'Gamma', type: 'float', default: 1.0, min: 0.1, max: 3.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  {
    id: 'sepia',
    name: 'Sepia Tone',
    category: 'color',
    complexity: 'low',
    description: 'Classic sepia tone effect',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_intensity;
varying vec2 v_texcoord;

void main() {
    vec3 color = texture2D(u_texture, v_texcoord).rgb;
    
    vec3 sepia;
    sepia.r = dot(color, vec3(0.393, 0.769, 0.189));
    sepia.g = dot(color, vec3(0.349, 0.686, 0.168));
    sepia.b = dot(color, vec3(0.272, 0.534, 0.131));
    
    color = mix(color, sepia, u_intensity);
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_intensity', label: 'Intensity', type: 'float', default: 1.0, min: 0.0, max: 1.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  {
    id: 'gba-color',
    name: 'GBA Color',
    category: 'color',
    complexity: 'low',
    description: 'Game Boy Advance color correction',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_target_gamma;
uniform float u_display_gamma;
uniform float u_saturation;
uniform float u_luminance;
varying vec2 v_texcoord;

void main() {
    vec3 color = texture2D(u_texture, v_texcoord).rgb;
    
    // GBA color correction matrix
    mat3 color_matrix = mat3(
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0
    );
    
    color = color_matrix * color;
    
    // Gamma correction
    color = pow(color, vec3(u_target_gamma / u_display_gamma));
    
    // Saturation and luminance adjustment
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luma), color, u_saturation);
    color *= u_luminance;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_target_gamma', label: 'Target Gamma', type: 'float', default: 2.2, min: 1.0, max: 3.0, step: 0.1 },
      { name: 'u_display_gamma', label: 'Display Gamma', type: 'float', default: 2.2, min: 1.0, max: 3.0, step: 0.1 },
      { name: 'u_saturation', label: 'Saturation', type: 'float', default: 1.0, min: 0.0, max: 2.0, step: 0.01 },
      { name: 'u_luminance', label: 'Luminance', type: 'float', default: 1.0, min: 0.5, max: 2.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  // Pixel Art Effects
  {
    id: 'pixel-aa',
    name: 'Pixel Anti-Aliasing',
    category: 'pixel',
    complexity: 'medium',
    description: 'Smart anti-aliasing for pixel art',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_sharpness;
varying vec2 v_texcoord;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec2 pixel = v_texcoord * u_resolution;
    vec2 seam = floor(pixel + 0.5);
    vec2 dudv = pixel - seam;
    
    vec4 center = texture2D(u_texture, v_texcoord);
    vec4 left = texture2D(u_texture, v_texcoord - vec2(texelSize.x, 0.0));
    vec4 right = texture2D(u_texture, v_texcoord + vec2(texelSize.x, 0.0));
    vec4 top = texture2D(u_texture, v_texcoord - vec2(0.0, texelSize.y));
    vec4 bottom = texture2D(u_texture, v_texcoord + vec2(0.0, texelSize.y));
    
    // Edge detection
    vec4 edgeX = abs(right - left);
    vec4 edgeY = abs(bottom - top);
    vec4 edge = edgeX + edgeY;
    float edgeFactor = dot(edge.rgb, vec3(0.333));
    
    // Adaptive filtering
    vec4 smooth = (center * 4.0 + left + right + top + bottom) / 8.0;
    vec4 sharp = center;
    
    vec4 result = mix(smooth, sharp, u_sharpness * (1.0 - edgeFactor));
    
    gl_FragColor = result;
}`,
    uniforms: [
      { name: 'u_sharpness', label: 'Sharpness', type: 'float', default: 0.7, min: 0.0, max: 1.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  {
    id: 'scale2x',
    name: 'Scale2X',
    category: 'pixel',
    complexity: 'low',
    description: 'Classic Scale2X pixel art upscaling',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
varying vec2 v_texcoord;

void main() {
    vec2 texelSize = 1.0 / u_resolution;
    
    vec3 E = texture2D(u_texture, v_texcoord).rgb;
    vec3 D = texture2D(u_texture, v_texcoord + vec2(-texelSize.x, 0.0)).rgb;
    vec3 F = texture2D(u_texture, v_texcoord + vec2(texelSize.x, 0.0)).rgb;
    vec3 H = texture2D(u_texture, v_texcoord + vec2(0.0, texelSize.y)).rgb;
    vec3 B = texture2D(u_texture, v_texcoord + vec2(0.0, -texelSize.y)).rgb;
    
    vec2 fp = fract(v_texcoord * u_resolution);
    
    vec3 color = E;
    if (fp.x < 0.5 && fp.y < 0.5) {
        // Top-left
        if (distance(D, B) < distance(F, H) && D != B) color = D;
    } else if (fp.x >= 0.5 && fp.y < 0.5) {
        // Top-right
        if (distance(D, B) < distance(F, H) && B != F) color = F;
    } else if (fp.x < 0.5 && fp.y >= 0.5) {
        // Bottom-left
        if (distance(D, B) < distance(F, H) && D != H) color = D;
    } else {
        // Bottom-right
        if (distance(D, B) < distance(F, H) && F != H) color = F;
    }
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [],
    isMobileCompatible: true,
    needsTexture: true
  },

  // Special Effects
  {
    id: 'vhs-effect',
    name: 'VHS Effect',
    category: 'special',
    complexity: 'medium',
    description: 'Retro VHS tape distortion effect',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_distortion;
uniform float u_noise;
uniform float u_scanlines;
varying vec2 v_texcoord;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = v_texcoord;
    
    // VHS horizontal distortion
    float distortionY = sin(uv.y * 20.0 + u_time * 2.0) * u_distortion;
    uv.x += distortionY * 0.01;
    
    // Color separation
    vec2 offset = vec2(u_distortion * 0.005, 0.0);
    float r = texture2D(u_texture, uv + offset).r;
    float g = texture2D(u_texture, uv).g;
    float b = texture2D(u_texture, uv - offset).b;
    
    vec3 color = vec3(r, g, b);
    
    // Noise
    float noise = random(uv + u_time) * u_noise;
    color += noise;
    
    // Scanlines
    float scanline = sin(uv.y * u_resolution.y * 3.14159) * 0.5 + 0.5;
    color *= mix(1.0, scanline, u_scanlines);
    
    // Vignette
    float vignette = 1.0 - distance(uv, vec2(0.5)) * 0.7;
    color *= vignette;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_time', label: 'Time', type: 'float', default: 0.0 },
      { name: 'u_distortion', label: 'Distortion', type: 'float', default: 0.5, min: 0.0, max: 2.0, step: 0.01 },
      { name: 'u_noise', label: 'Noise', type: 'float', default: 0.1, min: 0.0, max: 0.5, step: 0.01 },
      { name: 'u_scanlines', label: 'Scanlines', type: 'float', default: 0.3, min: 0.0, max: 1.0, step: 0.01 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  },

  {
    id: 'film-grain',
    name: 'Film Grain',
    category: 'special',
    complexity: 'low',
    description: 'Analog film grain texture',
    vertexShader: basicVertexShader,
    fragmentShader: `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_time;
uniform float u_intensity;
uniform float u_size;
varying vec2 v_texcoord;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec3 color = texture2D(u_texture, v_texcoord).rgb;
    
    vec2 grainCoord = v_texcoord * u_size + u_time;
    float grain = random(grainCoord) * 2.0 - 1.0;
    
    // Apply grain more to darker areas
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float grainFactor = u_intensity * (1.0 - luminance * 0.5);
    
    color += grain * grainFactor;
    
    gl_FragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'u_time', label: 'Time', type: 'float', default: 0.0 },
      { name: 'u_intensity', label: 'Intensity', type: 'float', default: 0.05, min: 0.0, max: 0.2, step: 0.001 },
      { name: 'u_size', label: 'Size', type: 'float', default: 100.0, min: 50.0, max: 500.0, step: 10.0 }
    ],
    isMobileCompatible: true,
    needsTexture: true
  }
];

export function getShaderByCategory(category: string): WorkingShader[] {
  if (category === 'all') return WORKING_SHADERS;
  return WORKING_SHADERS.filter(shader => shader.category === category);
}

export function getShaderById(id: string): WorkingShader | undefined {
  return WORKING_SHADERS.find(shader => shader.id === id);
}

export function getCategoryInfo() {
  const categories = {
    all: { name: 'All Shaders', count: WORKING_SHADERS.length, description: 'All available shaders' },
    crt: { name: 'CRT Effects', count: 0, description: 'Classic CRT monitor simulation' },
    blur: { name: 'Blur & Glow', count: 0, description: 'Blur and glow effects' },
    color: { name: 'Color & LUT', count: 0, description: 'Color correction and lookup tables' },
    pixel: { name: 'Pixel Art', count: 0, description: 'Pixel art enhancement and scaling' },
    special: { name: 'Special Effects', count: 0, description: 'Unique visual effects' }
  };

  // Count shaders per category
  WORKING_SHADERS.forEach(shader => {
    categories[shader.category].count++;
  });

  return categories;
} 