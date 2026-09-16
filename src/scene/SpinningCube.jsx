'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Placeholder mesh. Vectors/refs are hoisted outside useFrame per project
 * convention — never allocate inside the render loop.
 */
export default function SpinningCube() {
  const meshRef = useRef(null);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.4;
    meshRef.current.rotation.y += delta * 0.6;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  );
}
