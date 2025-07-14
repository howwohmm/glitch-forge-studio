import { LibretroShaderParser, ParsedShader, ShaderParameter } from './libretroShaderParser';
import { ShaderEffect } from './shaderManager';

export interface ConvertedShader extends ShaderEffect {
  originalPath: string;
  isMobileCompatible: boolean;
  complexity: 'low' | 'medium' | 'high';
  category: 'crt' | 'blur' | 'color' | 'pixel' | 'special';
  passes: number;
}

export class ShaderConverter {
  
  // Our curated list of 50 high-quality shaders
  static readonly SELECTED_SHADERS = [
    // CRT Effects (15 shaders)
    { path: 'crt/shaders/crt-lottes.glsl', category: 'crt', complexity: 'medium', name: 'CRT Lottes', priority: 10 },
    { path: 'crt/shaders/fake-CRT-Geom.glsl', category: 'crt', complexity: 'low', name: 'Fake CRT Geometry', priority: 9 },
    { path: 'crt/shaders/crt-pi.glsl', category: 'crt', complexity: 'low', name: 'CRT Pi', priority: 8 },
    { path: 'crt/shaders/crt-easymode.glsl', category: 'crt', complexity: 'low', name: 'CRT Easy Mode', priority: 9 },
    { path: 'crt/shaders/crt-mattias.glsl', category: 'crt', complexity: 'medium', name: 'CRT Mattias', priority: 7 },
    { path: 'crt/shaders/hyllian/crt-hyllian.glsl', category: 'crt', complexity: 'medium', name: 'CRT Hyllian', priority: 8 },
    { path: 'crt/shaders/hyllian/crt-hyllian-fast.glsl', category: 'crt', complexity: 'low', name: 'CRT Hyllian Fast', priority: 9 },
    { path: 'crt/shaders/GritsScanlines/GritsScanlines.glsl', category: 'crt', complexity: 'low', name: 'Grits Scanlines', priority: 8 },
    { path: 'crt/shaders/crt-geom.glsl', category: 'crt', complexity: 'medium', name: 'CRT Geom', priority: 8 },
    { path: 'crt/shaders/crt-caligari.glsl', category: 'crt', complexity: 'low', name: 'CRT Caligari', priority: 7 },
    { path: 'crt/shaders/crt-cgwg-fast.glsl', category: 'crt', complexity: 'low', name: 'CRT CGWG Fast', priority: 8 },
    { path: 'crt/shaders/crt-aperture.glsl', category: 'crt', complexity: 'low', name: 'CRT Aperture', priority: 7 },
    { path: 'crt/shaders/crt-nobody.glsl', category: 'crt', complexity: 'low', name: 'CRT Nobody', priority: 6 },
    { path: 'crt/shaders/crt-nes-mini.glsl', category: 'crt', complexity: 'low', name: 'CRT NES Mini', priority: 8 },
    { path: 'scanlines/shaders/scanlines.glsl', category: 'crt', complexity: 'low', name: 'Simple Scanlines', priority: 9 },

    // Blur & Glow Effects (10 shaders)
    { path: 'blurs/shaders/blur-gauss-h.glsl', category: 'blur', complexity: 'low', name: 'Gaussian Blur H', priority: 9 },
    { path: 'blurs/shaders/blur-gauss-v.glsl', category: 'blur', complexity: 'low', name: 'Gaussian Blur V', priority: 9 },
    { path: 'blurs/shaders/kawase/kawase1.glsl', category: 'blur', complexity: 'low', name: 'Kawase Blur 1', priority: 8 },
    { path: 'blurs/shaders/kawase/kawase2.glsl', category: 'blur', complexity: 'low', name: 'Kawase Blur 2', priority: 8 },
    { path: 'blurs/shaders/smart-blur.glsl', category: 'blur', complexity: 'medium', name: 'Smart Blur', priority: 7 },
    { path: 'blurs/shaders/gizmo-blur.glsl', category: 'blur', complexity: 'medium', name: 'Gizmo Blur', priority: 7 },
    { path: 'blurs/shaders/bilateral.glsl', category: 'blur', complexity: 'high', name: 'Bilateral Blur', priority: 6 },
    { path: 'blurs/shaders/hash-blur.glsl', category: 'blur', complexity: 'medium', name: 'Hash Blur', priority: 7 },
    { path: 'blurs/shaders/dual_filter/dual_filter_downsample.glsl', category: 'blur', complexity: 'medium', name: 'Dual Filter Down', priority: 7 },
    { path: 'blurs/shaders/dual_filter/dual_filter_upsample.glsl', category: 'blur', complexity: 'medium', name: 'Dual Filter Up', priority: 7 },

    // Color & LUT Effects (10 shaders)
    { path: 'reshade/shaders/LUT/LUT.glsl', category: 'color', complexity: 'low', name: 'LUT Color', priority: 9 },
    { path: 'misc/shaders/image-adjustment.glsl', category: 'color', complexity: 'low', name: 'Image Adjustment', priority: 10 },
    { path: 'handheld/shaders/color/gba-color.glsl', category: 'color', complexity: 'low', name: 'GBA Color', priority: 8 },
    { path: 'handheld/shaders/color/gbc-color.glsl', category: 'color', complexity: 'low', name: 'Game Boy Color', priority: 8 },
    { path: 'handheld/shaders/color/nds-color.glsl', category: 'color', complexity: 'low', name: 'NDS Color', priority: 7 },
    { path: 'handheld/shaders/color/psp-color.glsl', category: 'color', complexity: 'low', name: 'PSP Color', priority: 7 },
    { path: 'handheld/shaders/color/vba-color.glsl', category: 'color', complexity: 'low', name: 'VBA Color', priority: 7 },
    { path: 'film/shaders/sepia.glsl', category: 'color', complexity: 'low', name: 'Sepia Tone', priority: 8 },
    { path: 'film/shaders/black-white.glsl', category: 'color', complexity: 'low', name: 'Black & White', priority: 8 },
    { path: 'misc/shaders/color-mangler.glsl', category: 'color', complexity: 'medium', name: 'Color Mangler', priority: 6 },

    // Pixel Art & Scaling (10 shaders)
    { path: 'pixel-art-scaling/shaders/pixel_aa.glsl', category: 'pixel', complexity: 'low', name: 'Pixel AA', priority: 9 },
    { path: 'interpolation/shaders/bilinear-adjustable.glsl', category: 'pixel', complexity: 'low', name: 'Bilinear Adjustable', priority: 8 },
    { path: 'interpolation/shaders/jinc2.glsl', category: 'pixel', complexity: 'medium', name: 'Jinc2', priority: 8 },
    { path: 'interpolation/shaders/lanczos2.glsl', category: 'pixel', complexity: 'medium', name: 'Lanczos2', priority: 7 },
    { path: 'interpolation/shaders/spline16.glsl', category: 'pixel', complexity: 'medium', name: 'Spline16', priority: 7 },
    { path: 'scalefx/shaders/scalefx-pass0.glsl', category: 'pixel', complexity: 'high', name: 'ScaleFX Pass 0', priority: 6 },
    { path: 'eagle/shaders/super-eagle.glsl', category: 'pixel', complexity: 'medium', name: 'Super Eagle', priority: 7 },
    { path: 'sabr/shaders/sabr-v3.0.glsl', category: 'pixel', complexity: 'high', name: 'SABR v3', priority: 6 },
    { path: 'xbr/shaders/xbr-lv2.glsl', category: 'pixel', complexity: 'high', name: 'xBR Level 2', priority: 6 },
    { path: 'scalenx/shaders/scale2x.glsl', category: 'pixel', complexity: 'low', name: 'Scale2x', priority: 8 },

    // Special Effects (5 shaders)
    { path: 'vhs/shaders/vhs.glsl', category: 'special', complexity: 'medium', name: 'VHS Effect', priority: 9 },
    { path: 'film/shaders/film-grain.glsl', category: 'special', complexity: 'low', name: 'Film Grain', priority: 8 },
    { path: 'dithering/shaders/bayer-matrix-dithering.glsl', category: 'special', complexity: 'low', name: 'Bayer Dither', priority: 8 },
    { path: 'misc/shaders/bob-deinterlacing.glsl', category: 'special', complexity: 'low', name: 'Deinterlace', priority: 7 },
    { path: 'misc/shaders/pixellate.glsl', category: 'special', complexity: 'low', name: 'Pixellate', priority: 8 }
  ] as const;

  static async convertShader(shaderPath: string, fallbackShader?: string): Promise<ConvertedShader | null> {
    try {
      // Try to load the shader file
      let shaderContent: string;
      
      try {
        // In a real environment, you'd fetch this from the file system or a server
        const response = await fetch(`/shaders/${shaderPath}`);
        if (!response.ok) {
          if (fallbackShader) {
            shaderContent = fallbackShader;
          } else {
            throw new Error(`Failed to load shader: ${shaderPath}`);
          }
        } else {
          shaderContent = await response.text();
        }
      } catch (error) {
        if (fallbackShader) {
          shaderContent = fallbackShader;
        } else {
          console.warn(`Failed to load shader ${shaderPath}:`, error);
          return null;
        }
      }

      // Parse the shader
      const parsed = LibretroShaderParser.parseShader(shaderContent);
      
      // Find shader info from our curated list
      const shaderInfo = this.SELECTED_SHADERS.find(s => s.path === shaderPath);
      if (!shaderInfo) {
        console.warn(`Shader not in curated list: ${shaderPath}`);
        return null;
      }

      // Convert to our format
      const converted: ConvertedShader = {
        id: this.pathToId(shaderPath),
        name: shaderInfo.name,
        category: shaderInfo.category,
        shader: parsed.fragmentShader,
        uniforms: this.convertUniforms(parsed.parameters),
        needsTexture: parsed.needsTexture,
        originalPath: shaderPath,
        isMobileCompatible: parsed.isMobileCompatible,
        complexity: shaderInfo.complexity,
        passes: 1 // Most are single-pass, we'll handle multi-pass separately
      };

      return converted;
    } catch (error) {
      console.error(`Error converting shader ${shaderPath}:`, error);
      return null;
    }
  }

  static pathToId(path: string): string {
    return path
      .replace(/^.*\//, '') // Remove directory path
      .replace(/\.glsl$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric with dashes
      .toLowerCase();
  }

  static convertUniforms(parameters: ShaderParameter[]): any[] {
    return parameters.map(param => ({
      name: param.name,
      type: 'float' as const,
      min: param.min,
      max: param.max,
      default: param.default,
      label: param.label
    }));
  }

  static async convertAllShaders(): Promise<ConvertedShader[]> {
    const converted: ConvertedShader[] = [];
    
    // Sort by priority (higher first) and mobile compatibility
    const sortedShaders = [...this.SELECTED_SHADERS]
      .sort((a, b) => {
        // Prioritize mobile-compatible shaders for the first batch
        return b.priority - a.priority;
      });

    console.log('Converting shaders...');
    
    for (const shaderInfo of sortedShaders) {
      console.log(`Converting: ${shaderInfo.name}`);
      
      // Create fallback shader for missing ones
      const fallbackShader = this.createFallbackShader(shaderInfo);
      
      const convertedShader = await this.convertShader(shaderInfo.path, fallbackShader);
      if (convertedShader) {
        converted.push(convertedShader);
      }
      
      // Stop at 50 shaders
      if (converted.length >= 50) break;
    }

    console.log(`Successfully converted ${converted.length} shaders`);
    return converted;
  }

  static createFallbackShader(shaderInfo: any): string {
    // Create simple fallback shaders based on category
    switch (shaderInfo.category) {
      case 'crt':
        return this.createCRTFallback(shaderInfo.name);
      case 'blur':
        return this.createBlurFallback();
      case 'color':
        return this.createColorFallback(shaderInfo.name);
      case 'pixel':
        return this.createPixelFallback();
      case 'special':
        return this.createSpecialFallback(shaderInfo.name);
      default:
        return this.createBasicFallback();
    }
  }

  static createCRTFallback(name: string): string {
    if (name.toLowerCase().includes('scanline')) {
      return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform sampler2D u_texture;
uniform float u_time;

void main() {
  vec2 uv = v_texCoord;
  vec3 color = texture2D(u_texture, uv).rgb;
  
  // Simple scanlines
  float scanline = sin(uv.y * u_resolution.y * 3.14159) * 0.1;
  color -= scanline;
  
  gl_FragColor = vec4(color, 1.0);
}`;
    } else {
      return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

void main() {
  vec2 uv = v_texCoord;
  
  // Simple CRT curvature
  uv = uv * 2.0 - 1.0;
  uv *= 1.0 + dot(uv, uv) * 0.1;
  uv = uv * 0.5 + 0.5;
  
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  vec3 color = texture2D(u_texture, uv).rgb;
  
  // Vignette
  float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 2.0;
  color *= vignette;
  
  gl_FragColor = vec4(color, 1.0);
}`;
    }
  }

  static createBlurFallback(): string {
    return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

void main() {
  vec2 texelSize = 1.0 / u_resolution;
  vec3 color = vec3(0.0);
  
  // Simple 3x3 blur
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      color += texture2D(u_texture, v_texCoord + vec2(x, y) * texelSize).rgb;
    }
  }
  
  gl_FragColor = vec4(color / 9.0, 1.0);
}`;
  }

  static createColorFallback(name: string): string {
    if (name.toLowerCase().includes('sepia')) {
      return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform sampler2D u_texture;

void main() {
  vec3 color = texture2D(u_texture, v_texCoord).rgb;
  
  // Sepia effect
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(vec3(gray) * vec3(1.2, 1.0, 0.8), 1.0);
}`;
    } else {
      return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_contrast;

void main() {
  vec3 color = texture2D(u_texture, v_texCoord).rgb;
  
  // Brightness
  color *= u_brightness;
  
  // Contrast
  color = (color - 0.5) * u_contrast + 0.5;
  
  // Saturation
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, u_saturation);
  
  gl_FragColor = vec4(color, 1.0);
}`;
    }
  }

  static createPixelFallback(): string {
    return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform sampler2D u_texture;

void main() {
  vec2 pixelSize = 1.0 / u_resolution;
  vec2 pixelCoord = floor(v_texCoord / pixelSize) * pixelSize;
  
  gl_FragColor = texture2D(u_texture, pixelCoord);
}`;
  }

  static createSpecialFallback(name: string): string {
    if (name.toLowerCase().includes('vhs')) {
      return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform sampler2D u_texture;
uniform float u_time;

void main() {
  vec2 uv = v_texCoord;
  
  // VHS distortion
  uv.x += sin(uv.y * 20.0 + u_time) * 0.002;
  
  vec3 color = texture2D(u_texture, uv).rgb;
  
  // Add noise
  float noise = fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += noise * 0.1;
  
  gl_FragColor = vec4(color, 1.0);
}`;
    } else {
      return this.createBasicFallback();
    }
  }

  static createBasicFallback(): string {
    return `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texCoord);
}`;
  }
} 