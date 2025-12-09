import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { AppMode } from '../types';

// Constants
const PARTICLE_COUNT = 300;
const PHOTO_PLACEHOLDER_COUNT = 15;
const TREE_HEIGHT = 5;
const TREE_RADIUS_BASE = 2.5;

// Geometries
const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
const boxGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
const photoGeo = new THREE.PlaneGeometry(0.5, 0.5);

// Materials
const goldMaterial = new THREE.MeshStandardMaterial({
  color: '#d4af37',
  roughness: 0.2,
  metalness: 0.9,
  emissive: '#d4af37',
  emissiveIntensity: 0.2
});
const redMaterial = new THREE.MeshStandardMaterial({
  color: '#8a1c1c',
  roughness: 0.4,
  metalness: 0.4,
  emissive: '#500',
  emissiveIntensity: 0.1
});

interface ParticleData {
  id: number;
  // Tree State Positions
  treePos: THREE.Vector3;
  // Scatter State Positions
  scatterPos: THREE.Vector3;
  // Current interpolated pos
  currentPos: THREE.Vector3;
  // Rotation
  rotationSpeed: THREE.Vector3;
}

const TreeParticles: React.FC = () => {
  const { mode, photos, cameraRotation, zoomPhotoIndex } = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const photoGroupRef = useRef<THREE.Group>(null);
  
  // Create randomized data once
  const particles = useMemo(() => {
    const temp: ParticleData[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Tree Calculation (Cone)
      // y from -TREE_HEIGHT/2 to TREE_HEIGHT/2
      const y = (Math.random() * TREE_HEIGHT) - (TREE_HEIGHT / 2);
      // Normalized height (0 at top, 1 at bottom approx) for radius calc
      const hNorm = 1 - ((y + TREE_HEIGHT/2) / TREE_HEIGHT);
      const r = hNorm * TREE_RADIUS_BASE;
      const theta = Math.random() * Math.PI * 2;
      
      const treeX = r * Math.cos(theta);
      const treeZ = r * Math.sin(theta);

      // Scatter Calculation (Sphere/Cloud)
      const scatterR = 4 + Math.random() * 3;
      const thetaS = Math.random() * Math.PI * 2;
      const phiS = Math.acos(2 * Math.random() - 1);
      
      const scatterX = scatterR * Math.sin(phiS) * Math.cos(thetaS);
      const scatterY = scatterR * Math.sin(phiS) * Math.sin(thetaS);
      const scatterZ = scatterR * Math.cos(phiS);

      temp.push({
        id: i,
        treePos: new THREE.Vector3(treeX, y, treeZ),
        scatterPos: new THREE.Vector3(scatterX, scatterY, scatterZ),
        currentPos: new THREE.Vector3(treeX, y, treeZ),
        rotationSpeed: new THREE.Vector3(
          Math.random() * 0.02, 
          Math.random() * 0.02, 
          Math.random() * 0.02
        )
      });
    }
    return temp;
  }, []);

  // Refs for Instanced Meshes
  const goldRef = useRef<THREE.InstancedMesh>(null);
  const redRef = useRef<THREE.InstancedMesh>(null);

  // Helper object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!goldRef.current || !redRef.current) return;

    // Apply Camera Rotation influence from Hand Tracker
    if (groupRef.current) {
      // Smoothly interpolate rotation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, cameraRotation.x, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, cameraRotation.y, 0.05);
    }

    let goldIdx = 0;
    let redIdx = 0;

    particles.forEach((p, i) => {
      let target: THREE.Vector3;

      if (mode === AppMode.TREE) {
        target = p.treePos;
      } else {
        target = p.scatterPos;
      }
      
      // Lerp position
      const speed = mode === AppMode.ZOOM ? 2 : 3; // Faster snap in zoom
      p.currentPos.lerp(target, delta * speed);

      // Add idle float in scatter mode
      if (mode !== AppMode.TREE) {
         p.currentPos.y += Math.sin(state.clock.elapsedTime + p.id) * 0.005;
      }

      dummy.position.copy(p.currentPos);
      
      // Rotate individually
      dummy.rotation.x += p.rotationSpeed.x;
      dummy.rotation.y += p.rotationSpeed.y;
      dummy.rotation.z += p.rotationSpeed.z;
      
      dummy.updateMatrix();

      // Distribute between Gold Spheres and Red Cubes
      if (i % 2 === 0 && goldIdx < PARTICLE_COUNT / 2) {
        goldRef.current!.setMatrixAt(goldIdx++, dummy.matrix);
      } else if (redIdx < PARTICLE_COUNT / 2) {
        redRef.current!.setMatrixAt(redIdx++, dummy.matrix);
      }
    });

    goldRef.current.instanceMatrix.needsUpdate = true;
    redRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={goldRef} args={[sphereGeo, goldMaterial, PARTICLE_COUNT / 2]} castShadow receiveShadow />
      <instancedMesh ref={redRef} args={[boxGeo, redMaterial, PARTICLE_COUNT / 2]} castShadow receiveShadow />
      
      {/* Photos are separate meshes because they need individual textures */}
      <PhotoCloud />
    </group>
  );
};

const PhotoCloud: React.FC = () => {
    const { photos, mode, zoomPhotoIndex } = useStore();
    const photoMeshes = useRef<THREE.Mesh[]>([]);

    // If no photos, use placeholders
    const displayPhotos = useMemo(() => {
        if (photos.length > 0) return photos;
        // Generate placeholders
        return Array.from({ length: 6 }).map((_, i) => ({
             id: `placeholder-${i}`,
             url: `https://picsum.photos/400/400?random=${i}`
        }));
    }, [photos]);

    // Calculate positions for photos (interspersed in tree)
    const photoPositions = useMemo(() => {
        return displayPhotos.map((_, i) => {
            const y = (Math.random() * TREE_HEIGHT * 0.8) - (TREE_HEIGHT / 2) + 0.5;
            const hNorm = 1 - ((y + TREE_HEIGHT/2) / TREE_HEIGHT);
            const r = hNorm * TREE_RADIUS_BASE + 0.2; // Slightly outside
            const theta = (Math.PI * 2 / displayPhotos.length) * i;
            
            return {
                tree: new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)),
                scatter: new THREE.Vector3(
                    (Math.random() - 0.5) * 8, 
                    (Math.random() - 0.5) * 6, 
                    (Math.random() - 0.5) * 4
                )
            };
        });
    }, [displayPhotos]);

    useFrame((state, delta) => {
        photoMeshes.current.forEach((mesh, i) => {
            if (!mesh) return;

            const isZoomTarget = mode === AppMode.ZOOM && i === (zoomPhotoIndex % displayPhotos.length);
            
            let targetPos: THREE.Vector3;
            let targetRot: THREE.Quaternion = new THREE.Quaternion();
            let targetScale = 1;

            if (isZoomTarget) {
                // Move to front center
                // Note: The parent group rotates, so we need to compensate or just move it close to camera in world space?
                // Easier: Just move it to a fixed position relative to group, but large.
                // Or better: inverse the group rotation logic.
                // For simplicity: Move to (0, 0, 4) in local space
                targetPos = new THREE.Vector3(0, 0, 3.5);
                targetScale = 3.5;
                // Face forward
                targetRot.setFromEuler(new THREE.Euler(0, 0, 0));
            } else if (mode === AppMode.TREE) {
                targetPos = photoPositions[i].tree;
                // Face outward from center
                const dummy = new THREE.Object3D();
                dummy.position.copy(targetPos);
                dummy.lookAt(0, targetPos.y, 0); // Look at center
                // We want to look OUT, so rotate 180 Y
                dummy.rotation.y += Math.PI;
                targetRot.setFromEuler(dummy.rotation);
                targetScale = 1;
            } else {
                // Scatter
                targetPos = photoPositions[i].scatter;
                // Random drift
                 targetPos.y += Math.sin(state.clock.elapsedTime + i) * 0.002;
                 targetRot.setFromEuler(new THREE.Euler(
                     state.clock.elapsedTime * 0.1 + i, 
                     state.clock.elapsedTime * 0.1, 
                     0
                ));
                targetScale = 1;
            }

            mesh.position.lerp(targetPos, delta * 3);
            mesh.quaternion.slerp(targetRot, delta * 3);
            mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 3);
            
            // LookAt camera if zoomed
            if (isZoomTarget) {
                 mesh.lookAt(state.camera.position);
            }
        });
    });

    return (
        <>
            {displayPhotos.map((photo, i) => (
                <PhotoItem 
                    key={photo.id} 
                    url={photo.url} 
                    index={i}
                    refCallback={(el) => (photoMeshes.current[i] = el!)}
                />
            ))}
        </>
    );
};

interface PhotoItemProps {
    url: string;
    index: number;
    refCallback: (el: THREE.Mesh | null) => void;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ url, refCallback }) => {
    const texture = useLoader(THREE.TextureLoader, url);
    return (
        <mesh ref={refCallback} castShadow>
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial 
                map={texture} 
                side={THREE.DoubleSide} 
                transparent 
                opacity={1}
                metalness={0.1}
                roughness={0.8}
            />
            {/* Gold Border */}
            <mesh position={[0, 0, -0.01]}>
                <boxGeometry args={[0.85, 0.85, 0.05]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.2} />
            </mesh>
        </mesh>
    );
}

export default TreeParticles;