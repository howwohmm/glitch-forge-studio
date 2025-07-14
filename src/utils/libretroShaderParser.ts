export interface ShaderParameter {
  name: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface ParsedShader {
  vertexShader: string;
  fragmentShader: string;
  parameters: ShaderParameter[];
  uniforms: string[];
  needsTexture: boolean;
  isMobileCompatible: boolean;
}

export interface ShaderPass {
  shader: ParsedShader;
  filterLinear: boolean;
  scaleType?: string;
  scale?: number;
  frameCountMod?: number;
}

export interface ShaderPreset {
  passes: ShaderPass[];
  textures: { [key: string]: string };
}

export class LibretroShaderParser {
  
  static parseShader(glslContent: string): ParsedShader {
    // Extract parameters
    const parameters = this.extractParameters(glslContent);
    
    // Split vertex and fragment shaders
    const vertexMatch = glslContent.match(/#if defined\(VERTEX\)([\s\S]*?)#elif defined\(FRAGMENT\)/);
    const fragmentMatch = glslContent.match(/#elif defined\(FRAGMENT\)([\s\S]*?)(?:#endif|$)/);
    
    if (!vertexMatch || !fragmentMatch) {
      throw new Error('Invalid libretro shader format');
    }
    
    let vertexShader = this.convertVertexShader(vertexMatch[1]);
    let fragmentShader = this.convertFragmentShader(fragmentMatch[1]);
    
    // Extract uniform information
    const uniforms = this.extractUniforms(fragmentShader);
    
    // Check if needs texture
    const needsTexture = fragmentShader.includes('Texture') || fragmentShader.includes('texture2D');
    
    // Mobile compatibility check
    const isMobileCompatible = this.checkMobileCompatibility(fragmentShader);
    
    return {
      vertexShader,
      fragmentShader,
      parameters,
      uniforms,
      needsTexture,
      isMobileCompatible
    };
  }
  
  static extractParameters(content: string): ShaderParameter[] {
    const parameters: ShaderParameter[] = [];
    const pragmaRegex = /#pragma parameter (\w+) "([^"]+)" ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)/g;
    
    let match;
    while ((match = pragmaRegex.exec(content)) !== null) {
      parameters.push({
        name: match[1],
        label: match[2],
        default: parseFloat(match[3]),
        min: parseFloat(match[4]),
        max: parseFloat(match[5]),
        step: parseFloat(match[6])
      });
    }
    
    return parameters;
  }
  
  static convertVertexShader(libretroVertex: string): string {
    // Convert libretro vertex shader to standard WebGL
    let converted = `
attribute vec4 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
varying vec2 vTexCoord;

uniform vec2 u_resolution;
uniform vec2 u_textureSize;
uniform vec2 u_outputSize;
uniform int u_frameCount;
uniform float u_time;

void main() {
  gl_Position = a_position;
  v_texCoord = a_texCoord;
  vTexCoord = a_texCoord;
  
  // Compatibility variables
  vec2 TextureSize = u_textureSize;
  vec2 OutputSize = u_outputSize;
  vec2 InputSize = u_textureSize;
  int FrameCount = u_frameCount;
}`;
    
    return converted;
  }
  
  static convertFragmentShader(libretroFragment: string): string {
    let converted = libretroFragment;
    
    // Replace libretro-specific uniforms
    const replacements = [
      // Compatibility defines
      [/COMPAT_VARYING/g, 'varying'],
      [/COMPAT_TEXTURE/g, 'texture2D'],
      [/COMPAT_PRECISION/g, ''],
      
      // Uniform conversions
      [/uniform\s+COMPAT_PRECISION\s+int\s+FrameDirection;/g, ''],
      [/uniform\s+COMPAT_PRECISION\s+int\s+FrameCount;/g, 'uniform int u_frameCount;'],
      [/uniform\s+COMPAT_PRECISION\s+vec2\s+OutputSize;/g, 'uniform vec2 u_outputSize;'],
      [/uniform\s+COMPAT_PRECISION\s+vec2\s+TextureSize;/g, 'uniform vec2 u_textureSize;'],
      [/uniform\s+COMPAT_PRECISION\s+vec2\s+InputSize;/g, 'uniform vec2 u_inputSize;'],
      [/uniform\s+sampler2D\s+Texture;/g, 'uniform sampler2D u_texture;'],
      [/uniform\s+mat4\s+MVPMatrix;/g, ''],
      
      // Variable conversions
      [/\bTexture\b/g, 'u_texture'],
      [/\bFrameCount\b/g, 'u_frameCount'],
      [/\bOutputSize\b/g, 'u_outputSize'],
      [/\bTextureSize\b/g, 'u_textureSize'],
      [/\bInputSize\b/g, 'u_inputSize'],
      [/\bTEX0\.xy\b/g, 'v_texCoord'],
      [/\bvTexCoord\b/g, 'v_texCoord'],
      
      // Source size compatibility
      [/\bSourceSize\b/g, 'vec4(u_textureSize, 1.0 / u_textureSize)'],
      [/\bOutSize\b/g, 'vec4(u_outputSize, 1.0 / u_outputSize)'],
      
      // Fragment output
      [/\bFragColor\b/g, 'gl_FragColor'],
      [/out\s+vec4\s+FragColor;/g, '']
    ];
    
    // Apply all replacements
    replacements.forEach(([regex, replacement]) => {
      converted = converted.replace(regex, replacement as string);
    });
    
    // Add precision and varying declarations at the top
    const header = `
#ifdef GL_ES
precision mediump float;
#endif

varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform float u_time;
`;
    
    converted = header + converted;
    
    return converted;
  }
  
  static extractUniforms(fragmentShader: string): string[] {
    const uniforms: string[] = [];
    const uniformRegex = /uniform\s+\w+\s+(\w+);/g;
    
    let match;
    while ((match = uniformRegex.exec(fragmentShader)) !== null) {
      uniforms.push(match[1]);
    }
    
    return uniforms;
  }
  
  static checkMobileCompatibility(fragmentShader: string): boolean {
    // Check for mobile-incompatible features
    const incompatibleFeatures = [
      /precision\s+highp/, // High precision
      /for\s*\([^)]*;\s*\w+\s*<\s*(\d+)/, // Large loops
      /texture2D.*,.*,.*\)/, // Complex texture sampling
      /#version\s+[3-9]/, // GLSL 3.0+
    ];
    
    // Check loop sizes
    const loopMatch = fragmentShader.match(/for\s*\([^)]*;\s*\w+\s*<\s*(\d+)/g);
    if (loopMatch) {
      for (const loop of loopMatch) {
        const sizeMatch = loop.match(/(\d+)/);
        if (sizeMatch && parseInt(sizeMatch[1]) > 16) {
          return false; // Large loops are mobile-incompatible
        }
      }
    }
    
    return !incompatibleFeatures.some(regex => regex.test(fragmentShader));
  }
  
  static parsePreset(glslpContent: string): ShaderPreset {
    const lines = glslpContent.split('\n');
    const passes: ShaderPass[] = [];
    const textures: { [key: string]: string } = {};
    
    let shaderCount = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('shaders = ')) {
        shaderCount = parseInt(trimmed.split('=')[1].trim());
      } else if (trimmed.startsWith('shader')) {
        const match = trimmed.match(/shader(\d+)\s*=\s*(.+)/);
        if (match) {
          const index = parseInt(match[1]);
          const path = match[2].trim();
          // We'll populate this with actual shader data later
          passes[index] = { shader: {} as ParsedShader, filterLinear: false };
        }
      } else if (trimmed.startsWith('filter_linear')) {
        const match = trimmed.match(/filter_linear(\d+)\s*=\s*(.+)/);
        if (match) {
          const index = parseInt(match[1]);
          const value = match[2].trim() === 'true';
          if (passes[index]) {
            passes[index].filterLinear = value;
          }
        }
      }
    }
    
    return { passes, textures };
  }
} 