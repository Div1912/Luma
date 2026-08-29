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
      ? new THREE.Color(0x000000) // Black background for dark theme
      : new THREE.Color(0xffffff); // White background for light theme
  };

  // Function to get particle color based on theme (Ice-blue & white blend for liquid glass)
  const getParticleColor = (theme: string) => {
    return theme === 'dark' 
      ? new THREE.Vector3(0.72, 0.83, 0.94) // Subtle Ice Blue (#b8d4f0)
      : new THREE.Vector3(0.0, 0.0, 0.0);
  };

  const particleVertex = `
    attribute float scale;
    uniform float uTime;
    void main() {
      vec3 p = position;
      float s = scale;
      p.y += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
      p.x += (sin(p.y + uTime) * 0.5);
      s += (sin(p.x + uTime) * 0.5) + (cos(p.y + uTime) * 0.1) * 2.0;
      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = s * 16.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const particleFragment = `
    uniform vec3 uColor;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = (1.0 - dist * 2.0) * 0.4;
      gl_FragColor = vec4(uColor, alpha);
    }
  `;

  const initScene = () => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const aspectRatio = winWidth / winHeight;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.01, 1000);
    camera.position.set(0, 5.5, 4.8);

    // Scene
    const scene = new THREE.Scene();

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: transparent,
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

    // Particles
    const gap = 0.32;
    const amountX = 180;
    const amountY = 180;
    const particleNum = amountX * amountY;
    const particlePositions = new Float32Array(particleNum * 3);
    const particleScales = new Float32Array(particleNum);
    
    let i = 0;
    let j = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        particlePositions[i] = ix * gap - ((amountX * gap) / 2);
        particlePositions[i + 1] = 0;
        particlePositions[i + 2] = iy * gap - ((amountX * gap) / 2);
        particleScales[j] = 1;
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
