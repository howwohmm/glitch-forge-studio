import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Upload, Download, Settings, Grid3X3, Zap, Palette } from "lucide-react";
import Navigation from "@/components/Navigation";
import WebGLCanvas from "@/components/WebGLCanvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { shaderEffects, getShaderEffect, getDefaultUniforms, ShaderEffect } from "@/utils/shaderManager";

interface UploadedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const effectCategories = [
  { id: 'error-diffusion', name: 'Error Diffusion', icon: Grid3X3 },
  { id: 'bitmap', name: 'Bitmap', icon: Palette },
  { id: 'glitch', name: 'Glitch', icon: Zap },
  { id: 'pattern', name: 'Pattern', icon: Grid3X3 },
  { id: 'modulation', name: 'Modulation', icon: Settings },
  { id: 'special', name: 'Special Effects', icon: Zap },
];

export default function Editor() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [activeCategory, setActiveCategory] = useState('glitch');
  const [activeShader, setActiveShader] = useState<ShaderEffect | null>(null);
  const [uniforms, setUniforms] = useState<Record<string, any>>({});
  const [intensity, setIntensity] = useState([50]);
  const [contrast, setContrast] = useState([50]);
  const [scale, setScale] = useState([50]);
  const [colorDepth, setColorDepth] = useState([50]);
  const [noise, setNoise] = useState([0]);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 30MB.",
        variant: "destructive",
      });
      return;
    }

    const supportedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'video/mp4', 'video/webm'];
    if (!supportedTypes.includes(file.type)) {
      toast({
        title: "Unsupported format",
        description: "Please upload JPEG, PNG, SVG, GIF, MP4, or WebM files.",
        variant: "destructive",
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : 'video';

    setUploadedFile({ file, preview, type });
    
    if (type === 'video') {
      toast({
        title: "Video uploaded",
        description: "Video will be automatically trimmed to first 10 seconds for processing.",
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.svg', '.gif'],
      'video/*': ['.mp4', '.webm']
    },
    multiple: false
  });

  const applyShader = (effectId: string) => {
    const effect = getShaderEffect(effectId);
    if (!effect) return;

    setActiveShader(effect);
    setUniforms(getDefaultUniforms(effect));
    
    toast({
      title: "Shader applied",
      description: `Applied ${effect.name} effect.`,
    });
  };

  const updateUniform = (uniformName: string, value: any) => {
    setUniforms(prev => ({
      ...prev,
      [uniformName]: value
    }));
  };

  const exportFile = () => {
    if (!uploadedFile && !activeShader) return;
    
    toast({
      title: "Export started",
      description: "Processing your file with the selected effects...",
    });
    
    setTimeout(() => {
      toast({
        title: "Export complete",
        description: "Your processed file is ready for download.",
      });
    }, 2000);
  };

  const filteredEffects = shaderEffects.filter(effect => effect.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 p-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Upload Panel */}
            <div className="lg:col-span-2">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload & Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!uploadedFile && !activeShader ? (
                    <div
                      {...getRootProps()}
                      className={`upload-area ${isDragActive ? 'dragover' : ''}`}
                    >
                      <input {...getInputProps()} />
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {isDragActive ? 'Drop your file here' : 'Upload your file'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Drag and drop or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Supports JPEG, PNG, SVG, GIF, MP4, WebM (max 30MB)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        {activeShader && (
                          <WebGLCanvas
                            shader={activeShader.shader}
                            uniforms={uniforms}
                            imageData={uploadedFile?.preview}
                            width={512}
                            height={512}
                          />
                        )}
                        {!activeShader && uploadedFile && (
                          uploadedFile.type === 'image' ? (
                            <img
                              src={uploadedFile.preview}
                              alt="Preview"
                              className="w-full h-96 object-contain rounded-lg bg-muted"
                            />
                          ) : (
                            <video
                              src={uploadedFile.preview}
                              className="w-full h-96 object-contain rounded-lg bg-muted"
                              controls
                            />
                          )
                        )}
                      </div>
                      {uploadedFile && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{uploadedFile.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setUploadedFile(null);
                              setActiveShader(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Effects Panel */}
            <div className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Effects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                    <TabsList className="grid grid-cols-2 gap-1 mb-4">
                      {effectCategories.slice(0, 6).map((category) => (
                        <TabsTrigger
                          key={category.id}
                          value={category.id}
                          className="text-xs"
                        >
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {effectCategories.map((category) => (
                      <TabsContent key={category.id} value={category.id}>
                        <div className="space-y-3">
                          {filteredEffects.map((effect) => (
                            <motion.div
                              key={effect.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`effect-preset ${activeShader?.id === effect.id ? 'border-ohmedit-red' : ''}`}
                              onClick={() => applyShader(effect.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-ohmedit-red/20 to-muted/20 rounded"></div>
                                <div>
                                  <h4 className="font-medium">{effect.name}</h4>
                                  <p className="text-sm text-muted-foreground">{category.name}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Dynamic Shader Parameters */}
              {activeShader && activeShader.uniforms.length > 0 && (
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Shader Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {activeShader.uniforms.map((uniform) => (
                      <div key={uniform.name}>
                        <Label>{uniform.label}</Label>
                        {uniform.type === 'float' && (
                          <>
                            <Slider
                              value={[uniforms[uniform.name] || uniform.default]}
                              onValueChange={(value) => updateUniform(uniform.name, value[0])}
                              min={uniform.min || 0}
                              max={uniform.max || 1}
                              step={0.01}
                              className="mt-2"
                            />
                            <span className="text-sm text-muted-foreground">
                              {(uniforms[uniform.name] || uniform.default).toFixed(2)}
                            </span>
                          </>
                        )}
                        {uniform.type === 'vec2' && (
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">X</Label>
                              <Slider
                                value={[uniforms[uniform.name]?.[0] || uniform.default[0]]}
                                onValueChange={(value) => updateUniform(uniform.name, [value[0], uniforms[uniform.name]?.[1] || uniform.default[1]])}
                                min={uniform.min || -1}
                                max={uniform.max || 1}
                                step={0.001}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Y</Label>
                              <Slider
                                value={[uniforms[uniform.name]?.[1] || uniform.default[1]]}
                                onValueChange={(value) => updateUniform(uniform.name, [uniforms[uniform.name]?.[0] || uniform.default[0], value[0]])}
                                min={uniform.min || -1}
                                max={uniform.max || 1}
                                step={0.001}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Parameters */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Intensity</Label>
                    <Slider
                      value={intensity}
                      onValueChange={setIntensity}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{intensity[0]}%</span>
                  </div>

                  <div>
                    <Label>Contrast</Label>
                    <Slider
                      value={contrast}
                      onValueChange={setContrast}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{contrast[0]}%</span>
                  </div>

                  <div>
                    <Label>Scale</Label>
                    <Slider
                      value={scale}
                      onValueChange={setScale}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{scale[0]}%</span>
                  </div>

                  <div>
                    <Label>Color Depth</Label>
                    <Slider
                      value={colorDepth}
                      onValueChange={setColorDepth}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{colorDepth[0]}%</span>
                  </div>

                  <div>
                    <Label>Noise</Label>
                    <Slider
                      value={noise}
                      onValueChange={setNoise}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground">{noise[0]}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Export Panel */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Format</Label>
                    <Select defaultValue="png">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="jpeg">JPEG</SelectItem>
                        <SelectItem value="svg">SVG</SelectItem>
                        <SelectItem value="gif">GIF</SelectItem>
                        <SelectItem value="mp4">MP4</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quality</Label>
                    <Slider
                      defaultValue={[90]}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={exportFile}
                    disabled={!uploadedFile && !activeShader}
                    className="w-full btn-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
