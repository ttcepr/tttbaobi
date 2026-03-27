import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { EnvelopeDimensions } from '../types';

interface BoxProps {
  dimensions: EnvelopeDimensions;
}

const BoxMesh: React.FC<BoxProps> = ({ dimensions }) => {
  const meshRef = useRef<THREE.Group>(null);
  const { width, height, depth = 20 } = dimensions;

  // Convert mm to Three.js units (1 unit = 10mm for better visibility)
  const w = width / 10;
  const h = height / 10;
  const d = depth / 10;

  return (
    <group ref={meshRef}>
      {/* Front */}
      <mesh position={[0, 0, d / 2]}>
        <boxGeometry args={[w, h, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0, -d / 2]}>
        <boxGeometry args={[w, h, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Left */}
      <mesh position={[-w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Right */}
      <mesh position={[w / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, h, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Top */}
      <mesh position={[0, h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[w, d, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -h / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[w, d, 0.1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export const Box3D: React.FC<BoxProps> = ({ dimensions }) => {
  return (
    <div className="w-full h-[500px] bg-slate-100 rounded-2xl overflow-hidden shadow-inner relative">
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200 shadow-sm">
          Mô hình 3D (Thử nghiệm)
        </span>
      </div>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <BoxMesh dimensions={dimensions} />
        
        <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
