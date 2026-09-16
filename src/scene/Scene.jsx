'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import SpinningCube from './SpinningCube';

/**
 * Root 3D scene. Client-only — never server-rendered.
 */
export default function Scene() {
  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <SpinningCube />
      <OrbitControls />
    </Canvas>
  );
}
