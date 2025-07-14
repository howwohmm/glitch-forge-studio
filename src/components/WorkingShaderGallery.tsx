import React, { useState, useEffect, useMemo } from 'react';
import { WorkingShaderManager, ShaderCategory } from '../utils/workingShaderManager';
import { WorkingShader } from '../utils/workingShaders';
import SimpleWebGLCanvas from './SimpleWebGLCanvas';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Loader2, Search, Filter, Smartphone, Monitor, Zap, Play, Square } from 'lucide-react';

interface WorkingShaderGalleryProps {
  imageData?: string;
}

const WorkingShaderGallery: React.FC<WorkingShaderGalleryProps> = ({ imageData }) => {
  const [shaderManager] = useState(() => WorkingShaderManager.getInstance());
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ShaderCategory[]>([]);
  const [selectedShader, setSelectedShader] = useState<WorkingShader | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [mobileOnly, setMobileOnly] = useState(false);
  const [shaderUniforms, setShaderUniforms] = useState<Record<string, any>>({});
  const [isPlaying, setIsPlaying] = useState(true);

  // Initialize shaders
  useEffect(() => {
    const loadShaders = async () => {
      setIsLoading(true);
      await shaderManager.loadShaders();
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
    return shaderManager.filterShaders({
      category: selectedCategory,
      complexity: complexityFilter,
      mobileOnly,
      search: searchQuery
    });
  }, [shaderManager, selectedCategory, complexityFilter, mobileOnly, searchQuery]);

  // Update shader uniforms when shader changes
  useEffect(() => {
    if (selectedShader) {
      setShaderUniforms(shaderManager.getDefaultUniforms(selectedShader.id));
    }
  }, [selectedShader, shaderManager]);

  const handleShaderSelect = (shader: WorkingShader) => {
    setSelectedShader(shader);
    setIsPlaying(true);
  };

  const handleUniformChange = (uniformName: string, value: any) => {
    setShaderUniforms(prev => ({
      ...prev,
      [uniformName]: value
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
      case 'blur': return '✨';
      case 'color': return '🎨';
      case 'pixel': return '🔲';
      case 'special': return '🎭';
      default: return '🎯';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading Working Shaders...</p>
          <p className="text-sm text-gray-600">Initializing WebGL effects</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Working Shader Gallery
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real-time WebGL shaders with working implementations. {filteredShaders.length} effects available.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search shaders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {getCategoryIcon(category.id)} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={complexityFilter} onValueChange={(value: any) => setComplexityFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="mobile-only"
                  checked={mobileOnly}
                  onCheckedChange={setMobileOnly}
                />
                <Label htmlFor="mobile-only" className="flex items-center gap-1">
                  <Smartphone className="h-4 w-4" />
                  Mobile Compatible Only
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Shader List */}
          <Card>
            <CardHeader>
              <CardTitle>Shaders ({filteredShaders.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {filteredShaders.map(shader => (
                <div
                  key={shader.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedShader?.id === shader.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleShaderSelect(shader)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{shader.name}</span>
                    <div className="flex items-center gap-1">
                      {shader.isMobileCompatible && <Smartphone className="h-3 w-3 text-green-600" />}
                      <Badge className={`text-xs ${getComplexityColor(shader.complexity)}`}>
                        {shader.complexity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{shader.description}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs">{getCategoryIcon(shader.category)}</span>
                    <span className="text-xs text-gray-500 capitalize">{shader.category}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center Panel - Preview */}
        <div className="space-y-6">
          {selectedShader && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(selectedShader.category)}
                      {selectedShader.name}
                    </CardTitle>
                    <CardDescription>{selectedShader.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getComplexityColor(selectedShader.complexity)}>
                      {selectedShader.complexity}
                    </Badge>
                    {selectedShader.isMobileCompatible && (
                      <Badge className="bg-green-100 text-green-800">
                        <Smartphone className="h-3 w-3 mr-1" />
                        Mobile
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {isPlaying ? (
                    <SimpleWebGLCanvas
                      shader={selectedShader}
                      uniforms={shaderUniforms}
                      width={400}
                      height={300}
                      imageData={imageData}
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                      <Button onClick={() => setIsPlaying(true)} variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Resume Preview
                      </Button>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute top-2 right-2"
                    variant="outline"
                    size="sm"
                  >
                    {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Parameters */}
        {selectedShader && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Shader Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedShader.uniforms.length === 0 ? (
                  <p className="text-sm text-gray-500">No adjustable parameters</p>
                ) : (
                  selectedShader.uniforms.map(uniform => {
                    if (uniform.name === 'u_time') return null; // Skip time uniform
                    
                    const value = shaderUniforms[uniform.name] ?? uniform.default;
                    
                    return (
                      <div key={uniform.name} className="space-y-2">
                        <Label className="text-sm font-medium">{uniform.label}</Label>
                        
                        {uniform.type === 'float' && (
                          <div className="space-y-2">
                            <Slider
                              value={[value]}
                              onValueChange={([newValue]) => handleUniformChange(uniform.name, newValue)}
                              min={uniform.min ?? 0}
                              max={uniform.max ?? 1}
                              step={uniform.step ?? 0.01}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{uniform.min ?? 0}</span>
                              <span className="font-mono">{value.toFixed(3)}</span>
                              <span>{uniform.max ?? 1}</span>
                            </div>
                          </div>
                        )}
                        
                        {uniform.type === 'bool' && (
                          <Switch
                            checked={value}
                            onCheckedChange={(checked) => handleUniformChange(uniform.name, checked)}
                          />
                        )}
                        
                        {uniform.type === 'vec2' && Array.isArray(value) && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                value={value[0]}
                                onChange={(e) => handleUniformChange(uniform.name, [parseFloat(e.target.value), value[1]])}
                                placeholder="X"
                              />
                              <Input
                                type="number"
                                value={value[1]}
                                onChange={(e) => handleUniformChange(uniform.name, [value[0], parseFloat(e.target.value)])}
                                placeholder="Y"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Category Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {categories.map(category => (
                    <div
                      key={category.id}
                      className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${
                        selectedCategory === category.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {getCategoryIcon(category.id)} {category.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingShaderGallery; 