
import React, { useRef, useEffect, useState } from 'react';

interface WebGLCanvasProps {
  shader: string;
  uniforms: Record<string, any>;
  imageData?: string;
  width?: number;
  height?: number;
}

const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  shader,
  uniforms,
  imageData,
  width = 512,
  height = 512
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gl, setGl] = useState<WebGLRenderingContext | null>(null);
  const [program, setProgram] = useState<WebGLProgram | null>(null);
  const [texture, setTexture] = useState<WebGLTexture | null>(null);

  // Vertex shader (standard fullscreen quad)
  const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
      gl_Position = a_position;
    }
  `;

  const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };

  const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
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
  };

  const createTexture = (gl: WebGLRenderingContext, image: HTMLImageElement) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    
    return texture;
  };

  const setupGeometry = (gl: WebGLRenderingContext, program: WebGLProgram) => {
    const positionBuffer = gl.createBuffer();
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
  };

  const setUniforms = (gl: WebGLRenderingContext, program: WebGLProgram, uniforms: Record<string, any>) => {
    // Set resolution
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, width, height);
    
    // Set time
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    gl.uniform1f(timeLocation, Date.now() * 0.001);
    
    // Set texture
    if (texture) {
      const textureLocation = gl.getUniformLocation(program, 'u_texture');
      gl.uniform1i(textureLocation, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }
    
    // Set custom uniforms
    Object.entries(uniforms).forEach(([key, value]) => {
      const location = gl.getUniformLocation(program, key);
      if (location) {
        if (Array.isArray(value)) {
          if (value.length === 2) {
            gl.uniform2f(location, value[0], value[1]);
          } else if (value.length === 3) {
            gl.uniform3f(location, value[0], value[1], value[2]);
          }
        } else {
          gl.uniform1f(location, value);
        }
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const webglContext = canvas.getContext('webgl');
    if (!webglContext) {
      console.error('WebGL not supported');
      return;
    }

    setGl(webglContext);
    canvas.width = width;
    canvas.height = height;
    webglContext.viewport(0, 0, width, height);
  }, [width, height]);

  useEffect(() => {
    if (!gl || !shader) return;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shader);

    if (!vertexShader || !fragmentShader) return;

    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    if (!shaderProgram) return;

    setProgram(shaderProgram);
    gl.useProgram(shaderProgram);
    setupGeometry(gl, shaderProgram);
  }, [gl, shader]);

  useEffect(() => {
    if (!gl || !imageData) return;

    const image = new Image();
    image.onload = () => {
      const tex = createTexture(gl, image);
      setTexture(tex);
    };
    image.src = imageData;
  }, [gl, imageData]);

  useEffect(() => {
    if (!gl || !program) return;

    const render = () => {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      setUniforms(gl, program, uniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      requestAnimationFrame(render);
    };

    render();
  }, [gl, program, uniforms, texture]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      className="border border-border rounded-lg"
    />
  );
};

export default WebGLCanvas;
