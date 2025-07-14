import { WORKING_SHADERS, WorkingShader, getShaderByCategory, getShaderById, getCategoryInfo } from './workingShaders';

export interface ShaderCategory {
  id: string;
  name: string;
  description: string;
  count: number;
  shaders: WorkingShader[];
}

export class WorkingShaderManager {
  private static instance: WorkingShaderManager;
  private categories: Map<string, ShaderCategory> = new Map();
  private isLoaded: boolean = false;

  private constructor() {}

  static getInstance(): WorkingShaderManager {
    if (!WorkingShaderManager.instance) {
      WorkingShaderManager.instance = new WorkingShaderManager();
    }
    return WorkingShaderManager.instance;
  }

  async loadShaders(): Promise<void> {
    if (this.isLoaded) return;

    const categoryInfo = getCategoryInfo();
    
    // Initialize categories
    Object.entries(categoryInfo).forEach(([id, info]) => {
      if (id === 'all') return;
      
      this.categories.set(id, {
        id,
        name: info.name,
        description: info.description,
        count: info.count,
        shaders: getShaderByCategory(id)
      });
    });

    this.isLoaded = true;
    console.log('Loaded', WORKING_SHADERS.length, 'working shaders');
  }

  getCategories(): ShaderCategory[] {
    return Array.from(this.categories.values());
  }

  getAllShaders(): WorkingShader[] {
    return WORKING_SHADERS;
  }

  getShadersByCategory(categoryId: string): WorkingShader[] {
    if (categoryId === 'all') return WORKING_SHADERS;
    return getShaderByCategory(categoryId);
  }

  getShader(id: string): WorkingShader | undefined {
    return getShaderById(id);
  }

  searchShaders(query: string): WorkingShader[] {
    const lowercaseQuery = query.toLowerCase();
    return WORKING_SHADERS.filter(shader => 
      shader.name.toLowerCase().includes(lowercaseQuery) ||
      shader.description.toLowerCase().includes(lowercaseQuery) ||
      shader.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  filterShaders(options: {
    category?: string;
    complexity?: string;
    mobileOnly?: boolean;
    search?: string;
  }): WorkingShader[] {
    let filtered = WORKING_SHADERS;

    if (options.category && options.category !== 'all') {
      filtered = filtered.filter(shader => shader.category === options.category);
    }

    if (options.complexity && options.complexity !== 'all') {
      filtered = filtered.filter(shader => shader.complexity === options.complexity);
    }

    if (options.mobileOnly) {
      filtered = filtered.filter(shader => shader.isMobileCompatible);
    }

    if (options.search) {
      const query = options.search.toLowerCase();
      filtered = filtered.filter(shader => 
        shader.name.toLowerCase().includes(query) ||
        shader.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  getRecommendedShaders(limit: number = 5): WorkingShader[] {
    // Return top shaders sorted by category and mobile compatibility
    const recommended = WORKING_SHADERS
      .slice()
      .sort((a, b) => {
        // Prioritize mobile compatible shaders
        if (a.isMobileCompatible && !b.isMobileCompatible) return -1;
        if (!a.isMobileCompatible && b.isMobileCompatible) return 1;
        
        // Then by complexity (simpler first)
        const complexityOrder = { low: 0, medium: 1, high: 2 };
        const complexityDiff = complexityOrder[a.complexity] - complexityOrder[b.complexity];
        if (complexityDiff !== 0) return complexityDiff;
        
        // Finally by name
        return a.name.localeCompare(b.name);
      });

    return recommended.slice(0, limit);
  }

  getDefaultUniforms(shaderId: string): Record<string, any> {
    const shader = this.getShader(shaderId);
    if (!shader) return {};

    const uniforms: Record<string, any> = {};
    shader.uniforms.forEach(uniform => {
      uniforms[uniform.name] = uniform.default;
    });

    return uniforms;
  }

  isShaderLoaded(): boolean {
    return this.isLoaded;
  }

  getCategoryStats() {
    const stats = {
      total: WORKING_SHADERS.length,
      byCategory: {} as Record<string, number>,
      byComplexity: {} as Record<string, number>,
      mobileCompatible: WORKING_SHADERS.filter(s => s.isMobileCompatible).length
    };

    WORKING_SHADERS.forEach(shader => {
      stats.byCategory[shader.category] = (stats.byCategory[shader.category] || 0) + 1;
      stats.byComplexity[shader.complexity] = (stats.byComplexity[shader.complexity] || 0) + 1;
    });

    return stats;
  }
} 