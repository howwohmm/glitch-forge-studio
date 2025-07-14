import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ParsedShader, ShaderPass } from '../utils/libretroShaderParser';

interface MultiPassWebGLCanvasProps {
  passes: ShaderPass[];
  uniforms: Record<string, any>;
  imageData?: string;
  width?: number;
  height?: number;
  isMobile?: boolean;
}

interface FrameBuffer {
  frameBuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

const MultiPassWebGLCanvas: React.FC<MultiPassWebGLCanvasProps> = ({
  passes,
  uniforms,
  imageData,
  width = 512,
  height = 512,
  isMobile = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gl, setGl] = useState<WebGLRenderingContext | null>(null);
  const [programs, setPrograms] = useState<WebGLProgram[]>([]);
  const [framebuffers, setFramebuffers] = useState<FrameBuffer[]>([]);
  const [inputTexture, setInputTexture] = useState<WebGLTexture | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  // Vertex shader for fullscreen quad
  const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
      gl_Position = a_position;
      v_texCoord = a_texCoord;
    }
  `;

  const createShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      console.error('Shader source:', source);
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }, []);

  const createProgram = useCallback((gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  }, []);

  const createFramebuffer = useCallback((gl: WebGLRenderingContext, width: number, height: number): FrameBuffer | null => {
    const frameBuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    
    if (!frameBuffer || !texture) return null;
    
    // Set up texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // Set up framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer is not complete');
      return null;
    }
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return { frameBuffer, texture, width, height };
  }, []);

  const setupGeometry = useCallback((gl: WebGLRenderingContext, program: WebGLProgram) => {
    const positionBuffer = gl.createBuffer();
    const texCoordBuffer = gl.createBuffer();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = [
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    
    const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  }, []);

  const setUniforms = useCallback((gl: WebGLRenderingContext, program: WebGLProgram, passUniforms: Record<string, any>, passIndex: number) => {
    // Set resolution
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, width, height);
    }
    
    // Set texture size
    const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
    if (textureSizeLocation) {
      gl.uniform2f(textureSizeLocation, width, height);
    }
    
    // Set output size
    const outputSizeLocation = gl.getUniformLocation(program, 'u_outputSize');
    if (outputSizeLocation) {
      gl.uniform2f(outputSizeLocation, width, height);
    }
    
    // Set frame count
    const frameCountLocation = gl.getUniformLocation(program, 'u_frameCount');
    if (frameCountLocation) {
      gl.uniform1i(frameCountLocation, frameCount);
    }
    
    // Set time
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    if (timeLocation) {
      gl.uniform1f(timeLocation, Date.now() * 0.001);
    }
    
    // Set input texture
    const textureLocation = gl.getUniformLocation(program, 'u_texture');
    if (textureLocation) {
      gl.uniform1i(textureLocation, 0);
    }
    
    // Set custom uniforms
    Object.entries(passUniforms).forEach(([key, value]) => {
      const location = gl.getUniformLocation(program, key);
      if (location) {
        if (Array.isArray(value)) {
          if (value.length === 2) {
            gl.uniform2f(location, value[0], value[1]);
          } else if (value.length === 3) {
            gl.uniform3f(location, value[0], value[1], value[2]);
          } else if (value.length === 4) {
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
          }
        } else {
          gl.uniform1f(location, value);
        }
      }
    });
  }, [width, height, frameCount]);

  const createInputTexture = useCallback((gl: WebGLRenderingContext, image: HTMLImageElement) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    return texture;
  }, []);

  // Initialize WebGL context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const webglContext = canvas.getContext('webgl', {
      antialias: !isMobile,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    
    if (!webglContext) {
      console.error('WebGL not supported');
      return;
    }

    // Enable required extensions
    webglContext.getExtension('OES_texture_float');
    webglContext.getExtension('OES_texture_float_linear');

    setGl(webglContext);
    canvas.width = width;
    canvas.height = height;
    webglContext.viewport(0, 0, width, height);
  }, [width, height, isMobile]);

  // Create shader programs
  useEffect(() => {
    if (!gl || !passes.length) return;

    const newPrograms: WebGLProgram[] = [];
    
    for (const pass of passes) {
      // Filter out mobile-incompatible shaders
      if (isMobile && !pass.shader.isMobileCompatible) {
        console.warn('Skipping mobile-incompatible shader');
        continue;
      }
      
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, pass.shader.fragmentShader);

      if (!vertexShader || !fragmentShader) continue;

      const program = createProgram(gl, vertexShader, fragmentShader);
      if (program) {
        newPrograms.push(program);
      }
    }
    
    setPrograms(newPrograms);
  }, [gl, passes, createShader, createProgram, isMobile]);

  // Create framebuffers for multi-pass rendering
  useEffect(() => {
    if (!gl || !programs.length) return;

    const newFramebuffers: FrameBuffer[] = [];
    
    // Create framebuffers for all passes except the last one (which renders to screen)
    for (let i = 0; i < programs.length - 1; i++) {
      const fb = createFramebuffer(gl, width, height);
      if (fb) {
        newFramebuffers.push(fb);
      }
    }
    
    setFramebuffers(newFramebuffers);
  }, [gl, programs, width, height, createFramebuffer]);

  // Load input texture
  useEffect(() => {
    if (!gl || !imageData) return;

    const image = new Image();
    image.onload = () => {
      const tex = createInputTexture(gl, image);
      setInputTexture(tex);
    };
    image.src = imageData;
  }, [gl, imageData, createInputTexture]);

  // Render loop
  useEffect(() => {
    if (!gl || !programs.length) return;

    let animationId: number;
    
    const render = () => {
      setFrameCount(prev => prev + 1);
      
      let currentInputTexture = inputTexture;
      
      // Render each pass
      for (let i = 0; i < programs.length; i++) {
        const program = programs[i];
        const isLastPass = i === programs.length - 1;
        
        // Set up render target
        if (isLastPass) {
          // Final pass renders to screen
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, width, height);
        } else {
          // Intermediate pass renders to framebuffer
          const framebuffer = framebuffers[i];
          if (framebuffer) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.frameBuffer);
            gl.viewport(0, 0, framebuffer.width, framebuffer.height);
          }
        }
        
        // Clear and set up program
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        
        // Bind input texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, currentInputTexture);
        
        // Set up geometry and uniforms
        setupGeometry(gl, program);
        setUniforms(gl, program, uniforms, i);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Update input texture for next pass
        if (!isLastPass && framebuffers[i]) {
          currentInputTexture = framebuffers[i].texture;
        }
      }
      
      animationId = requestAnimationFrame(render);
    };

    if (inputTexture || !imageData) {
      render();
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gl, programs, framebuffers, inputTexture, uniforms, setupGeometry, setUniforms, imageData, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      className="border border-border rounded-lg"
    />
  );
};

export default MultiPassWebGLCanvas; 