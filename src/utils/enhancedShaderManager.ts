import { ShaderConverter, ConvertedShader } from './shaderConverter';
import { LibretroShaderParser, ParsedShader, ShaderPass } from './libretroShaderParser';

export interface EnhancedShaderEffect extends ConvertedShader {
  isLoaded: boolean;
  loadError?: string;
  fallbackUsed: boolean;
}

export interface ShaderCategory {
  name: string;
  shaders: EnhancedShaderEffect[];
  description: string;
}

export class EnhancedShaderManager {
  private static instance: EnhancedShaderManager;
  private shaders: Map<string, EnhancedShaderEffect> = new Map();
  private categories: Map<string, ShaderCategory> = new Map();
  private isLoading = false;
  private isMobile = false;

  private constructor() {
    this.detectMobile();
    this.initializeCategories();
  }

  static getInstance(): EnhancedShaderManager {
    if (!EnhancedShaderManager.instance) {
      EnhancedShaderManager.instance = new EnhancedShaderManager();
    }
    return EnhancedShaderManager.instance;
  }

  private detectMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                    window.innerWidth <= 768;
  }

  private initializeCategories(): void {
    this.categories.set('crt', {
      name: 'CRT Effects',
      shaders: [],
      description: 'Classic CRT monitor effects with scanlines, curvature, and phosphor glow'
    });

    this.categories.set('blur', {
      name: 'Blur & Glow',
      shaders: [],
      description: 'Various blur algorithms and glow effects for atmospheric rendering'
    });

    this.categories.set('color', {
      name: 'Color & LUT',
      shaders: [],
      description: 'Color correction, retro palettes, and lookup table effects'
    });

    this.categories.set('pixel', {
      name: 'Pixel Art',
      shaders: [],
      description: 'Scaling and enhancement for pixel art and retro graphics'
    });

    this.categories.set('special', {
      name: 'Special Effects',
      shaders: [],
      description: 'Unique visual effects like VHS, film grain, and distortion'
    });
  }

  async loadAllShaders(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    console.log(`Loading shaders for ${this.isMobile ? 'mobile' : 'desktop'} device...`);

    try {
      // Convert all shaders using our converter
      const convertedShaders = await ShaderConverter.convertAllShaders();
      
      for (const shader of convertedShaders) {
        // Skip mobile-incompatible shaders on mobile devices
        if (this.isMobile && !shader.isMobileCompatible) {
          console.log(`Skipping ${shader.name} - not mobile compatible`);
          continue;
        }

        const enhancedShader: EnhancedShaderEffect = {
          ...shader,
          isLoaded: true,
          fallbackUsed: false // We'll determine this during conversion
        };

        this.shaders.set(shader.id, enhancedShader);
        
        // Add to appropriate category
        const category = this.categories.get(shader.category);
        if (category) {
          category.shaders.push(enhancedShader);
        }
      }

      // Sort shaders within each category by priority and mobile compatibility
      for (const category of this.categories.values()) {
        category.shaders.sort((a, b) => {
          if (this.isMobile) {
            // On mobile, prioritize mobile-compatible shaders
            if (a.isMobileCompatible && !b.isMobileCompatible) return -1;
            if (!a.isMobileCompatible && b.isMobileCompatible) return 1;
          }
          // Then sort by complexity (simpler first) and name
          const complexityOrder = { low: 0, medium: 1, high: 2 };
          const complexityDiff = complexityOrder[a.complexity] - complexityOrder[b.complexity];
          if (complexityDiff !== 0) return complexityDiff;
          return a.name.localeCompare(b.name);
        });
      }

      console.log(`Successfully loaded ${this.shaders.size} shaders`);
      this.logShaderStats();

    } catch (error) {
      console.error('Failed to load shaders:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private logShaderStats(): void {
    const stats = {
      total: this.shaders.size,
      mobile: Array.from(this.shaders.values()).filter(s => s.isMobileCompatible).length,
      byCategory: {} as Record<string, number>,
      byComplexity: { low: 0, medium: 0, high: 0 }
    };

    for (const shader of this.shaders.values()) {
      stats.byCategory[shader.category] = (stats.byCategory[shader.category] || 0) + 1;
      stats.byComplexity[shader.complexity]++;
    }

    console.log('Shader Statistics:', stats);
  }

  getShader(id: string): EnhancedShaderEffect | undefined {
    return this.shaders.get(id);
  }

  getAllShaders(): EnhancedShaderEffect[] {
    return Array.from(this.shaders.values());
  }

  getShadersByCategory(category: string): EnhancedShaderEffect[] {
    const cat = this.categories.get(category);
    return cat ? cat.shaders : [];
  }

  getCategories(): ShaderCategory[] {
    return Array.from(this.categories.values());
  }

  getMobileCompatibleShaders(): EnhancedShaderEffect[] {
    return this.getAllShaders().filter(shader => shader.isMobileCompatible);
  }

  getShadersByComplexity(complexity: 'low' | 'medium' | 'high'): EnhancedShaderEffect[] {
    return this.getAllShaders().filter(shader => shader.complexity === complexity);
  }

  // Get recommended shaders based on device capability
  getRecommendedShaders(limit = 10): EnhancedShaderEffect[] {
    let shaders = this.getAllShaders();
    
    if (this.isMobile) {
      // For mobile, prefer low complexity, mobile-compatible shaders
      shaders = shaders
        .filter(s => s.isMobileCompatible)
        .sort((a, b) => {
          const complexityOrder = { low: 0, medium: 1, high: 2 };
          return complexityOrder[a.complexity] - complexityOrder[b.complexity];
        });
    } else {
      // For desktop, sort by priority and effect quality
      shaders = shaders.sort((a, b) => {
        // Prioritize by category (CRT > Color > Blur > Pixel > Special)
        const categoryOrder = { crt: 0, color: 1, blur: 2, pixel: 3, special: 4 };
        const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
        if (categoryDiff !== 0) return categoryDiff;
        
        // Then by complexity (medium complexity often looks best)
        const complexityScore = { low: 1, medium: 3, high: 2 };
        return complexityScore[b.complexity] - complexityScore[a.complexity];
      });
    }

    return shaders.slice(0, limit);
  }

  // Create shader passes for multi-pass effects
  createShaderPasses(shaderId: string): ShaderPass[] {
    const shader = this.getShader(shaderId);
    if (!shader) return [];

    // For now, most shaders are single-pass
    // We'll expand this for multi-pass effects like CRT-Royale
    const parsedShader: ParsedShader = {
      vertexShader: '', // Will be generated by MultiPassWebGLCanvas
      fragmentShader: shader.shader,
      parameters: shader.uniforms.map(u => ({
        name: u.name,
        label: u.label || u.name,
        min: u.min || 0,
        max: u.max || 1,
        default: Array.isArray(u.default) ? u.default[0] : (u.default || 0),
        step: 0.01
      })),
      uniforms: [],
      needsTexture: shader.needsTexture,
      isMobileCompatible: shader.isMobileCompatible
    };

    return [{
      shader: parsedShader,
      filterLinear: true
    }];
  }

  // Get default uniforms for a shader
  getDefaultUniforms(shaderId: string): Record<string, any> {
    const shader = this.getShader(shaderId);
    if (!shader) return {};

    const uniforms: Record<string, any> = {};
    shader.uniforms.forEach(uniform => {
      uniforms[uniform.name] = uniform.default;
    });

    return uniforms;
  }

  // Check if shaders are loaded
  isLoaded(): boolean {
    return !this.isLoading && this.shaders.size > 0;
  }

  // Get loading status
  getLoadingStatus(): { isLoading: boolean; loadedCount: number; totalExpected: number } {
    return {
      isLoading: this.isLoading,
      loadedCount: this.shaders.size,
      totalExpected: ShaderConverter.SELECTED_SHADERS.length
    };
  }

  // Search shaders by name or description
  searchShaders(query: string): EnhancedShaderEffect[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllShaders().filter(shader =>
      shader.name.toLowerCase().includes(lowercaseQuery) ||
      shader.category.toLowerCase().includes(lowercaseQuery) ||
      shader.id.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get performance tier recommendation
  getPerformanceTier(): 'low' | 'medium' | 'high' {
    if (this.isMobile) {
      return 'low';
    }
    
    // Simple heuristic based on browser capabilities
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return 'low';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Radeon')) {
        return 'high';
      }
    }
    
    return 'medium';
  }

  // Filter shaders by performance tier
  getShadersByPerformanceTier(tier?: 'low' | 'medium' | 'high'): EnhancedShaderEffect[] {
    const targetTier = tier || this.getPerformanceTier();
    
    return this.getAllShaders().filter(shader => {
      switch (targetTier) {
        case 'low':
          return shader.complexity === 'low' && shader.isMobileCompatible;
        case 'medium':
          return shader.complexity !== 'high';
        case 'high':
          return true; // All shaders allowed on high-end systems
        default:
          return false;
      }
    });
  }
} 