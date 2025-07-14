
import rgbShiftShader from '../shaders/rgb_shift.frag?raw';
import magmaShader from '../shaders/magma.frag?raw';
import orderedDitherShader from '../shaders/ordered_dither.frag?raw';

export interface ShaderUniform {
  name: string;
  type: 'float' | 'vec2' | 'vec3';
  min?: number;
  max?: number;
  default: number | number[];
  label: string;
}

export interface ShaderEffect {
  id: string;
  name: string;
  category: string;
  shader: string;
  uniforms: ShaderUniform[];
  needsTexture: boolean;
}

export const shaderEffects: ShaderEffect[] = [
  {
    id: 'rgb-shift',
    name: 'RGB Shift',
    category: 'glitch',
    shader: rgbShiftShader,
    needsTexture: true,
    uniforms: [
      {
        name: 'u_amount',
        type: 'vec2',
        min: -0.1,
        max: 0.1,
        default: [0.01, 0.01],
        label: 'Shift Amount'
      }
    ]
  },
  {
    id: 'magma',
    name: 'Magma',
    category: 'special',
    shader: magmaShader,
    needsTexture: false,
    uniforms: []
  },
  {
    id: 'ordered-dither',
    name: 'Ordered Dither',
    category: 'bitmap',
    shader: orderedDitherShader,
    needsTexture: true,
    uniforms: [
      {
        name: 'u_threshold',
        type: 'float',
        min: 0,
        max: 1,
        default: 0.5,
        label: 'Threshold'
      },
      {
        name: 'u_palette_size',
        type: 'float',
        min: 2,
        max: 256,
        default: 8,
        label: 'Palette Size'
      }
    ]
  }
];

export const getShaderEffect = (id: string): ShaderEffect | undefined => {
  return shaderEffects.find(effect => effect.id === id);
};

export const getDefaultUniforms = (effect: ShaderEffect): Record<string, any> => {
  const uniforms: Record<string, any> = {};
  effect.uniforms.forEach(uniform => {
    uniforms[uniform.name] = uniform.default;
  });
  return uniforms;
};
