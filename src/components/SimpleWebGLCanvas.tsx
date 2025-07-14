import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WorkingShader } from '../utils/workingShaders';

interface SimpleWebGLCanvasProps {
  shader: WorkingShader;
  uniforms: Record<string, any>;
  width?: number;
  height?: number;
  imageData?: string;
}

interface WebGLResources {
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  texcoordBuffer: WebGLBuffer;
  texture?: WebGLTexture;
}

const SimpleWebGLCanvas: React.FC<SimpleWebGLCanvasProps> = ({
  shader,
  uniforms,
  width = 400,
  height = 300,
  imageData
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const resourcesRef = useRef<WebGLResources | null>(null);
  const animationIdRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Create shader program
  const createShaderProgram = useCallback((gl: WebGLRenderingContext, shader: WorkingShader): WebGLProgram | null => {
    // Create vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) return null;
    
    gl.shaderSource(vertexShader, shader.vertexShader);
    gl.compileShader(vertexShader);
    
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
      return null;
    }

    // Create fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) return null;
    
    gl.shaderSource(fragmentShader, shader.fragmentShader);
    gl.compileShader(fragmentShader);
    
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
      return null;
    }

    // Create program
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }, []);

  // Create buffers and setup geometry
  const setupGeometry = useCallback((gl: WebGLRenderingContext, program: WebGLProgram) => {
    // Position buffer (full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1,  1,
      -1,  1,  1, -1,   1,  1,
    ]), gl.STATIC_DRAW);

    // Texture coordinate buffer
    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1,
    ]), gl.STATIC_DRAW);

    return { positionBuffer, texcoordBuffer };
  }, []);

  // Load texture from image data
  const loadTexture = useCallback((gl: WebGLRenderingContext, imageData?: string): WebGLTexture | null => {
    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (imageData) {
      // Load from image data
      const image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      };
      image.src = imageData;
    } else {
      // Create a default texture
      const pixels = new Uint8Array([
        255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,   255, 255, 0, 255,
        0, 255, 0, 255,   0, 0, 255, 255,   255, 255, 0, 255,   255, 0, 0, 255,
        0, 0, 255, 255,   255, 255, 0, 255,   255, 0, 0, 255,   0, 255, 0, 255,
        255, 255, 0, 255,   255, 0, 0, 255,   0, 255, 0, 255,   0, 0, 255, 255,
      ]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4, 4, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    return texture;
  }, []);

  // Render frame
  const render = useCallback((time: number) => {
    const gl = glRef.current;
    const resources = resourcesRef.current;
    
    if (!gl || !resources) return;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(resources.program);

    // Set up position attribute
    const positionLocation = gl.getAttribLocation(resources.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Set up texture coordinate attribute
    const texcoordLocation = gl.getAttribLocation(resources.program, 'a_texcoord');
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.texcoordBuffer);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Set texture uniform
    if (resources.texture) {
      const textureLocation = gl.getUniformLocation(resources.program, 'u_texture');
      gl.uniform1i(textureLocation, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, resources.texture);
    }

    // Set resolution uniform
    const resolutionLocation = gl.getUniformLocation(resources.program, 'u_resolution');
    if (resolutionLocation) {
      gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    }

    // Set custom uniforms
    shader.uniforms.forEach(uniform => {
      const location = gl.getUniformLocation(resources.program, uniform.name);
      if (location && uniforms[uniform.name] !== undefined) {
        const value = uniforms[uniform.name];
        
        switch (uniform.type) {
          case 'float':
            // Handle time uniform specially
            if (uniform.name === 'u_time') {
              gl.uniform1f(location, time * 0.001);
            } else {
              gl.uniform1f(location, value);
            }
            break;
          case 'vec2':
            if (Array.isArray(value) && value.length === 2) {
              gl.uniform2f(location, value[0], value[1]);
            }
            break;
          case 'vec3':
            if (Array.isArray(value) && value.length === 3) {
              gl.uniform3f(location, value[0], value[1], value[2]);
            }
            break;
          case 'vec4':
            if (Array.isArray(value) && value.length === 4) {
              gl.uniform4f(location, value[0], value[1], value[2], value[3]);
            }
            break;
          case 'int':
            gl.uniform1i(location, value);
            break;
          case 'bool':
            gl.uniform1i(location, value ? 1 : 0);
            break;
        }
      }
    });

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Continue animation
    animationIdRef.current = requestAnimationFrame(render);
  }, [shader, uniforms]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      setError('WebGL not supported');
      return;
    }

    glRef.current = gl;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [width, height]);

  // Setup shader and resources when shader changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    try {
      setError(null);

      // Create shader program
      const program = createShaderProgram(gl, shader);
      if (!program) {
        setError('Failed to create shader program');
        return;
      }

      // Setup geometry
      const buffers = setupGeometry(gl, program);
      if (!buffers.positionBuffer || !buffers.texcoordBuffer) {
        setError('Failed to create buffers');
        return;
      }

      // Load texture
      const texture = shader.needsTexture ? loadTexture(gl, imageData) : undefined;

      // Store resources
      resourcesRef.current = {
        program,
        positionBuffer: buffers.positionBuffer,
        texcoordBuffer: buffers.texcoordBuffer,
        texture
      };

      // Start rendering
      animationIdRef.current = requestAnimationFrame(render);

    } catch (err) {
      setError(`Shader error: ${err}`);
      console.error('Shader setup error:', err);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [shader, imageData, createShaderProgram, setupGeometry, loadTexture, render]);

  if (error) {
    return (
      <div className="flex items-center justify-center bg-red-100 border border-red-300 rounded p-4" style={{ width, height }}>
        <span className="text-red-600 text-sm">{error}</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-300 rounded"
      style={{ width, maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default SimpleWebGLCanvas; 