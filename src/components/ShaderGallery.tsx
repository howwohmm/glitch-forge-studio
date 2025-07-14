import React, { useState, useEffect, useMemo } from 'react';
import { EnhancedShaderManager, EnhancedShaderEffect, ShaderCategory } from '../utils/enhancedShaderManager';
import MultiPassWebGLCanvas from './MultiPassWebGLCanvas';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Loader2, Search, Filter, Smartphone, Monitor, Zap } from 'lucide-react';

interface ShaderGalleryProps {
  imageData?: string;
}

const ShaderGallery: React.FC<ShaderGalleryProps> = ({ imageData }) => {
  const [shaderManager] = useState(() => EnhancedShaderManager.getInstance());
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ShaderCategory[]>([]);
  const [selectedShader, setSelectedShader] = useState<EnhancedShaderEffect | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [mobileOnly, setMobileOnly] = useState(false);
  const [shaderUniforms, setShaderUniforms] = useState<Record<string, any>>({});

  // Initialize shaders
  useEffect(() => {
    const loadShaders = async () => {
      setIsLoading(true);
      await shaderManager.loadAllShaders();
      setCategories(shaderManager.getCategories());
      
      // Set a default shader
      const recommended = shaderManager.getRecommendedShaders(1);
      if (recommended.length > 0) {
        setSelectedShader(recommended[0]);
        setShaderUniforms(shaderManager.getDefaultUniforms(recommended[0].id));
      }
      
      setIsLoading(false);
    };

    loadShaders();
  }, [shaderManager]);

  // Filter shaders based on search and filters
  const filteredShaders = useMemo(() => {
    let shaders = shaderManager.getAllShaders();

    // Apply search
    if (searchQuery) {
      shaders = shaderManager.searchShaders(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      shaders = shaders.filter(s => s.category === selectedCategory);
    }

    // Apply complexity filter
    if (complexityFilter !== 'all') {
      shaders = shaders.filter(s => s.complexity === complexityFilter);
    }

    // Apply mobile filter
    if (mobileOnly) {
      shaders = shaders.filter(s => s.isMobileCompatible);
    }

    return shaders;
  }, [shaderManager, searchQuery, selectedCategory, complexityFilter, mobileOnly]);

  const handleShaderSelect = (shader: EnhancedShaderEffect) => {
    setSelectedShader(shader);
    setShaderUniforms(shaderManager.getDefaultUniforms(shader.id));
  };

  const handleUniformChange = (name: string, value: number | number[]) => {
    setShaderUniforms(prev => ({
      ...prev,
      [name]: Array.isArray(value) ? value[0] : value
    }));
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'crt': return '📺';
      case 'blur': return '🌫️';
      case 'color': return '🎨';
      case 'pixel': return '🎮';
      case 'special': return '✨';
      default: return '🔧';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading 50 premium shaders...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Optimizing for performance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Shader Gallery</h1>
        <p className="text-muted-foreground mb-4">
          50 premium shaders from the libretro collection, optimized for web
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            {shaderManager.getMobileCompatibleShaders().length} Mobile-Ready
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            {shaderManager.getAllShaders().length} Total Shaders
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Performance Optimized
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.name} value={cat.name.split(' ')[0].toLowerCase()}>
                    {getCategoryIcon(cat.name.split(' ')[0].toLowerCase())} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Complexity Filter */}
            <Select value={complexityFilter} onValueChange={(value: any) => setComplexityFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Complexity</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter */}
            <div className="flex items-center space-x-2">
              <Switch
                id="mobile-only"
                checked={mobileOnly}
                onCheckedChange={setMobileOnly}
              />
              <Label htmlFor="mobile-only" className="text-sm">Mobile Only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shader List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>
                Shaders ({filteredShaders.length})
              </CardTitle>
              <CardDescription>
                Click any shader to preview it
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredShaders.map((shader) => (
                  <div
                    key={shader.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted transition-colors ${
                      selectedShader?.id === shader.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => handleShaderSelect(shader)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm">{shader.name}</h3>
                      <div className="flex items-center gap-1">
                        {shader.isMobileCompatible && (
                          <Smartphone className="h-3 w-3 text-green-600" />
                        )}
                        <span className="text-lg">{getCategoryIcon(shader.category)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getComplexityColor(shader.complexity)}`}
                      >
                        {shader.complexity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {shader.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shader.needsTexture ? 'Requires texture' : 'Procedural'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Controls */}
        <div className="lg:col-span-2 space-y-6">
          {selectedShader ? (
            <>
              {/* Preview Canvas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedShader.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge className={getComplexityColor(selectedShader.complexity)}>
                        {selectedShader.complexity}
                      </Badge>
                      {selectedShader.isMobileCompatible && (
                        <Badge variant="outline" className="text-green-600">
                          <Smartphone className="h-3 w-3 mr-1" />
                          Mobile
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {categories.find(c => c.name.toLowerCase().includes(selectedShader.category))?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <MultiPassWebGLCanvas
                      passes={shaderManager.createShaderPasses(selectedShader.id)}
                      uniforms={shaderUniforms}
                      imageData={selectedShader.needsTexture ? imageData : undefined}
                      width={Math.min(window.innerWidth - 100, 512)}
                      height={Math.min(window.innerWidth - 100, 512)}
                      isMobile={window.innerWidth <= 768}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shader Controls */}
              {selectedShader.uniforms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Parameters</CardTitle>
                    <CardDescription>
                      Adjust shader parameters in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedShader.uniforms.map((uniform) => (
                      <div key={uniform.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            {uniform.label || uniform.name}
                          </Label>
                          <span className="text-sm text-muted-foreground">
                            {Array.isArray(shaderUniforms[uniform.name]) 
                              ? (shaderUniforms[uniform.name] as number[]).map(v => v.toFixed(2)).join(', ')
                              : (shaderUniforms[uniform.name] || 0).toFixed(2)
                            }
                          </span>
                        </div>
                        <Slider
                          value={[Array.isArray(shaderUniforms[uniform.name]) 
                            ? (shaderUniforms[uniform.name] as number[])[0]
                            : (shaderUniforms[uniform.name] || uniform.default || 0)
                          ]}
                          onValueChange={(value) => handleUniformChange(uniform.name, value)}
                          min={uniform.min || 0}
                          max={uniform.max || 1}
                          step={0.01}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a shader to preview</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Categories Overview</CardTitle>
          <CardDescription>
            Explore shaders by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setSelectedCategory(category.name.split(' ')[0].toLowerCase())}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {getCategoryIcon(category.name.split(' ')[0].toLowerCase())}
                  </div>
                  <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {category.shaders.length} shaders
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShaderGallery; 