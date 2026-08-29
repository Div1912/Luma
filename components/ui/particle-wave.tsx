"use client";

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ParticleWaveProps {
  className?: string;
  transparent?: boolean;
}

const ParticleWave: React.FC<ParticleWaveProps> = ({ className = '', transparent = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    particles: THREE.Points;
    particleMaterial: THREE.ShaderMaterial;
    animationId: number | null;
    mouse: THREE.Vector2;
  } | null>(null);

  // Function to detect current theme
  const getCurrentTheme = () => {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'dark';
  };

  // Function to get background color based on theme
  const getBackgroundColor = (theme: string) => {
    return theme === 'dark' 
      ? new THREE.Color(0x050811) // Deep midnight navy for dark theme
      : new THREE.Color(0xffffff); // White background for light theme
  };

  // Function to get particle color based on theme (Ice-blue & glowing cyan blend)
  const getParticleColor = (theme: string) => {
    return theme === 'dark' 
      ? new THREE.Vector3(0.72, 0.88, 1.0) // Luminous Ice Blue
      : new THREE.Vector3(0.1, 0.1, 0.1);
  };

  const particleVertex = `
    attribute float scale;
    uniform float uTime;
    varying float vHeight;
    void main() {
      vec3 p = position;
      float s = scale;
      
      // Undulating double wave equation across 3D space
      float elevation = sin(p.x * 0.28 + uTime * 1.2) * 1.7 + cos(p.z * 0.28 + uTime * 0.9) * 1.5;
      p.y += elevation;
      
      vHeight = (elevation + 3.2) / 6.4; // Normalized 0-1 for color blending
      
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(s * 45.0 * (1.0 / -mvPosition.z), 1.5, 12.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const particleFragment = `
    uniform vec3 uColor;
    varying float vHeight;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      
      // Soft radial glow falloff
      float glow = smoothstep(0.5, 0.05, dist);
      
      // Crest color highlights (white at wave peaks, ice blue in troughs)
      vec3 crestColor = mix(uColor, vec3(1.0, 1.0, 1.0), vHeight * 0.6);
      
      gl_FragColor = vec4(crestColor, glow * 0.85);
    }
  `;

  const initScene = () => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const aspectRatio = winWidth / winHeight;

    // Camera angled to see sweeping 3D landscape of particles
    const camera = new THREE.PerspectiveCamera(65, aspectRatio, 0.01, 1000);
    camera.position.set(0, 8.5, 14.5);
    camera.lookAt(0, -1.0, 0);

    // Scene
    const scene = new THREE.Scene();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: transparent,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(winWidth, winHeight);
    
    // Set initial background color based on theme
    const currentTheme = getCurrentTheme();
    if (!transparent) {
      renderer.setClearColor(getBackgroundColor(currentTheme));
    } else {
      renderer.setClearColor(0x000000, 0);
    }

    // Particles - Dense grid spanning horizon
    const gap = 0.35;
    const amountX = 160;
    const amountY = 160;
    const particleNum = amountX * amountY;
    const particlePositions = new Float32Array(particleNum * 3);
    const particleScales = new Float32Array(particleNum);
    
    let i = 0;
    let j = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[i] = ix * gap - ((amountX * gap) / 2);
        particlePositions[i + 1] = 0;
        particlePositions[i + 2] = iy * gap - ((amountY * gap) / 2);
        particleScales[j] = 1.0;
        i += 3;
        j++;
      }
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: getParticleColor(getCurrentTheme()) }
      }
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    const mouse = new THREE.Vector2(-10, -10);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      particles,
      particleMaterial,
      animationId: null,
      mouse
    };
  };

  const animate = () => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, particleMaterial } = sceneRef.current;
    
    particleMaterial.uniforms.uTime.value += 0.02;
    
    // Update particle color and background based on current theme
    const currentTheme = getCurrentTheme();
    particleMaterial.uniforms.uColor.value = getParticleColor(currentTheme);
    if (!transparent) {
      renderer.setClearColor(getBackgroundColor(currentTheme));
    }
    
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
    
    sceneRef.current.animationId = requestAnimationFrame(animate);
  };

  const handleResize = () => {
    if (!sceneRef.current || typeof window === 'undefined') return;

    const { camera, renderer } = sceneRef.current;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    camera.aspect = winWidth / winHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(winWidth, winHeight);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!sceneRef.current || typeof window === 'undefined') return;

    sceneRef.current.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    sceneRef.current.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  useEffect(() => {
    initScene();
    animate();

    const handleResizeEvent = () => handleResize();
    const handleMouseMoveEvent = (e: MouseEvent) => handleMouseMove(e);

    window.addEventListener('resize', handleResizeEvent);
    window.addEventListener('mousemove', handleMouseMoveEvent);

    return () => {
      if (sceneRef.current?.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      window.removeEventListener('resize', handleResizeEvent);
      window.removeEventListener('mousemove', handleMouseMoveEvent);
      
      // Cleanup Three.js resources
      if (sceneRef.current) {
        const { scene, renderer, particles } = sceneRef.current;
        scene.remove(particles);
        if (particles.geometry) particles.geometry.dispose();
        if (particles.material) {
          if (Array.isArray(particles.material)) {
            particles.material.forEach(material => material.dispose());
          } else {
            particles.material.dispose();
          }
        }
        renderer.dispose();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        overflow: 'hidden',
        zIndex: 0
      }}
    />
  );
};

export { ParticleWave };
export default ParticleWave;
