import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import FaceOccluder from './FaceOccluder';
// @ts-ignore - Importing WebGPU renderer from three
import WebGPURenderer from 'three/src/renderers/webgpu/WebGPURenderer.js';

interface ARSceneProps {
    landmarksRef: React.MutableRefObject<any>;
    videoElement: HTMLVideoElement | null;
    modelUrl?: string;
    productId?: string;
    productName?: string;
    performanceMode?: 'high' | 'eco';
}

function GlassesModel({ landmarksRef, modelUrl, productId, productName }: { landmarksRef: React.MutableRefObject<any>; modelUrl?: string; productId?: string; productName?: string }) {
    const meshRef = useRef<THREE.Group>(null);
    const gltf = modelUrl ? useGLTF(modelUrl, 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/') : null;

    // Choose a color based on the product name for visual feedback
    const frameColor = productName?.toLowerCase().includes('gold') ? '#d4af37' :
        productName?.toLowerCase().includes('chic') ? '#800000' :
            productName?.toLowerCase().includes('black') ? '#000000' : '#222222';

    const isAviator = productName?.toLowerCase().includes('aviator');

    useEffect(() => {
        if (gltf) {
            gltf.scene.traverse((child) => {
                const mesh = child as THREE.Mesh;
                if (mesh.isMesh) {
                    mesh.renderOrder = 1;
                }
            });
        }
    }, [gltf]);

    // Internal state for smoothed values
    const smoothPos = useRef(new THREE.Vector3());
    const smoothRot = useRef(new THREE.Euler());
    const smoothScale = useRef(new THREE.Vector3(1, 1, 1));

    useFrame((state) => {
        const landmarks = landmarksRef.current;
        if (!meshRef.current) return;

        if (!landmarks) {
            meshRef.current.visible = false;
            return;
        }
        meshRef.current.visible = true;

        // Key landmarks for alignment
        const noseBridge = landmarks[168];
        const leftInnerEye = landmarks[33];
        const rightInnerEye = landmarks[263];
        const leftTemple = landmarks[127];
        const rightTemple = landmarks[356];

        if (noseBridge && leftInnerEye && rightInnerEye) {
            // 1. Precise Positioning based on FOV
            // At distance 5 with FOV 40, visible width is ~3.6 units
            const viewportWidth = 3.65;
            const viewportHeight = viewportWidth / (state.viewport.aspect || 1.77);

            const targetX = (noseBridge.x - 0.5) * -viewportWidth;
            const targetY = (noseBridge.y - 0.5) * -viewportHeight;

            // depth estimation using eye distance (more stable than z-landmark)
            const eyeDist = Math.abs(rightInnerEye.x - leftInnerEye.x);
            const targetZ = -2 + (eyeDist * 5); // Simple linear mapping for depth

            smoothPos.current.lerp(new THREE.Vector3(targetX, targetY - 0.1, targetZ), 0.2);
            meshRef.current.position.copy(smoothPos.current);

            // 2. Rotation (Roll, Pitch, Yaw)
            const targetRot = new THREE.Euler();

            // Roll (Z) - precise eye-line angle
            const dx = rightInnerEye.x - leftInnerEye.x;
            const dy = rightInnerEye.y - leftInnerEye.y;
            targetRot.z = -Math.atan2(dy, dx);

            // Pitch (X) - Head tilt forward/backward
            // Using ratio of nose position to eye line for more stability
            const eyeCenterY = (leftInnerEye.y + rightInnerEye.y) / 2;
            const noseTip = landmarks[1];
            if (noseTip) {
                targetRot.x = (noseTip.y - eyeCenterY) * 1.5;
            }

            // Yaw (Y) - Head turn left/right
            const noseBridgeZ = landmarks[168].z;
            const earsDist = Math.abs(landmarks[234].z - landmarks[454].z);
            targetRot.y = (landmarks[234].z - landmarks[454].z) * 12;

            // Smoothing rotation
            meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, 0.2);
            meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, 0.2);
            meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, 0.2);

            // 3. Precise Morphological Scaling
            // Landmark 127 to 356 (temple to temple)
            const templeWidth = Math.sqrt(Math.pow(rightTemple.x - leftTemple.x, 2) + Math.pow(rightTemple.y - leftTemple.y, 2));

            // Standard glasses width is ~140mm (0.14 in normalized units)
            // We use a multiplier to map face width to 3D units accurately
            const scaleFactor = templeWidth * 9.5;
            smoothScale.current.lerp(new THREE.Vector3(scaleFactor, scaleFactor * 0.95, scaleFactor), 0.1);
            meshRef.current.scale.copy(smoothScale.current);
        }
    });

    return (
        <group ref={meshRef}>
            <FaceOccluder />
            {gltf ? (
                <primitive object={gltf.scene} />
            ) : (
                <group scale={[1.0, 0.9, 1.0]}>
                    {/* Upper Frame Beam */}
                    <mesh position={[0, 0, 0]} renderOrder={1}>
                        <boxGeometry args={[1.0, isAviator ? 0.02 : 0.05, 0.08]} />
                        <meshPhysicalMaterial
                            color={frameColor}
                            metalness={0.9}
                            roughness={0.1}
                            clearcoat={1.0}
                            clearcoatRoughness={0.1}
                        />
                    </mesh>

                    {/* Bridge */}
                    <mesh position={[0, isAviator ? -0.02 : -0.04, 0.04]} rotation={[0, 0, Math.PI]} renderOrder={1}>
                        <torusGeometry args={[0.08, 0.015, 12, 24, Math.PI]} />
                        <meshPhysicalMaterial
                            color={frameColor}
                            metalness={0.9}
                            roughness={0.1}
                            clearcoat={1.0}
                        />
                    </mesh>

                    {/* Right Lens Frame */}
                    <group position={[0.26, -0.15, 0.03]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
                            <cylinderGeometry args={[0.22, isAviator ? 0.28 : 0.22, 0.03, 32]} />
                            <meshPhysicalMaterial color={frameColor} metalness={0.8} roughness={0.2} clearcoat={0.5} />
                        </mesh>
                        <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
                            <cylinderGeometry args={[0.20, isAviator ? 0.26 : 0.20, 0.02, 32]} />
                            <meshPhysicalMaterial
                                color="#cceeff"
                                transparent
                                opacity={0.2}
                                transmission={0.95}
                                thickness={0.5}
                                roughness={0}
                                ior={1.5}
                            />
                        </mesh>
                    </group>

                    {/* Left Lens Frame */}
                    <group position={[-0.26, -0.15, 0.03]}>
                        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
                            <cylinderGeometry args={[0.22, isAviator ? 0.28 : 0.22, 0.03, 32]} />
                            <meshPhysicalMaterial color={frameColor} metalness={0.8} roughness={0.2} clearcoat={0.5} />
                        </mesh>
                        <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
                            <cylinderGeometry args={[0.20, isAviator ? 0.26 : 0.20, 0.02, 32]} />
                            <meshPhysicalMaterial
                                color="#cceeff"
                                transparent
                                opacity={0.2}
                                transmission={0.95}
                                thickness={0.5}
                                roughness={0}
                                ior={1.5}
                            />
                        </mesh>
                    </group>

                    {/* Arms */}
                    <mesh position={[0.48, -0.02, -0.25]} rotation={[0, 0.05, 0]} renderOrder={1}>
                        <boxGeometry args={[0.03, 0.03, 0.5]} />
                        <meshPhysicalMaterial color={frameColor} metalness={0.5} roughness={0.1} clearcoat={0.8} />
                    </mesh>
                    <mesh position={[-0.48, -0.02, -0.25]} rotation={[0, -0.05, 0]} renderOrder={1}>
                        <boxGeometry args={[0.03, 0.03, 0.5]} />
                        <meshPhysicalMaterial color={frameColor} metalness={0.5} roughness={0.1} clearcoat={0.8} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

export default function ARScene({ landmarksRef, videoElement, modelUrl, productId, productName, performanceMode = 'high' }: ARSceneProps) {
    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            <Canvas
                dpr={performanceMode === 'high' ? [1, 2] : [1, 1]} // Dynamic resolution
                gl={(canvas) => {
                    // Try WebGPU first, then fallback to WebGL
                    try {
                        const renderer = new WebGPURenderer({
                            canvas,
                            antialias: true,
                            alpha: true,
                            preserveDrawingBuffer: true,
                        });
                        return renderer;
                    } catch (e) {
                        console.warn('WebGPU not supported, falling back to WebGL');
                        return new THREE.WebGLRenderer({
                            canvas,
                            antialias: true,
                            alpha: true,
                            preserveDrawingBuffer: true,
                            powerPreference: "high-performance"
                        });
                    }
                }}
            >
                <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={40} />
                <ambientLight intensity={0.9} />
                <spotLight position={[5, 5, 5]} angle={0.2} intensity={1.2} />
                <Environment preset="city" />

                <React.Suspense fallback={null}>
                    <GlassesModel
                        landmarksRef={landmarksRef}
                        modelUrl={modelUrl}
                        productId={productId}
                        productName={productName}
                    />
                </React.Suspense>
            </Canvas>
        </div>
    );
}
