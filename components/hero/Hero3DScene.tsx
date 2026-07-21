"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Monolith() {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x += delta * 0.1;
      ring1Ref.current.rotation.y += delta * 0.15;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.1;
      ring2Ref.current.rotation.z += delta * 0.2;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x -= delta * 0.05;
      ring3Ref.current.rotation.z -= delta * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={1}>
        {/* Core Monolith - Dark Translucent Glass */}
        <mesh>
          <octahedronGeometry args={[1.5, 0]} />
          <meshPhysicalMaterial
            color="#050505"
            transmission={0.95}
            opacity={1}
            metalness={0.8}
            roughness={0.1}
            ior={2.5}
            thickness={3}
            specularIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>
        
        {/* Orbiting Inner Ring */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[2.4, 0.015, 16, 100]} />
          <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.2} />
        </mesh>
        
        {/* Orbiting Middle Ring */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.8, 0.01, 16, 100]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.4} />
        </mesh>
        
        {/* Orbiting Outer Ring */}
        <mesh ref={ring3Ref} rotation={[0, Math.PI / 4, Math.PI / 6]}>
          <torusGeometry args={[3.2, 0.005, 16, 100]} />
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.6} />
        </mesh>
      </Float>
    </group>
  );
}

export default function Hero3DScene() {
  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 2]}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 15]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#888888" />
        <Monolith />
        {/* Environment map for realistic glass reflections */}
        <Environment preset="studio" />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.2}
          maxPolarAngle={Math.PI / 2 + 0.2}
          minPolarAngle={Math.PI / 2 - 0.2}
        />
      </Canvas>
      {/* Vignette overlay for cinematic feel */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none opacity-80" />
    </div>
  );
}
