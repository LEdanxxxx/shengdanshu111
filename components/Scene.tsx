import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import TreeParticles from './TreeParticles';

const Scene: React.FC = () => {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={[1, 2]} // Performance optimization
      gl={{ antialias: false, toneMapping: 1, toneMappingExposure: 1.2 }}
    >
      <color attach="background" args={['#050a08']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} color="#1a2e26" />
      <spotLight 
        position={[10, 10, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={20} 
        color="#f7e7ce" 
        castShadow 
      />
      <pointLight position={[-10, -5, -10]} intensity={10} color="#8a1c1c" />
      <pointLight position={[0, 0, 5]} intensity={5} color="#d4af37" distance={10} />

      <Suspense fallback={null}>
        <Environment preset="city" />
        <TreeParticles />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#d4af37" />
      </Suspense>

      {/* Post Processing for Cinematic Feel */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} radius={0.4} />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
        <Noise opacity={0.05} />
      </EffectComposer>
      
      <OrbitControls enableZoom={false} enablePan={false} dampingFactor={0.05} />
    </Canvas>
  );
};

export default Scene;