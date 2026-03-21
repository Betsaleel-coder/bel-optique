import React from 'react';
import * as THREE from 'three';

export default function FaceOccluder() {
    return (
        <mesh renderOrder={0} position={[0, -0.1, -0.3]} scale={[0.45, 0.6, 0.45]}>
            {/* Generic head approximation */}
            <sphereGeometry args={[1, 32, 32]} />
            <meshBasicMaterial
                colorWrite={false}
                depthWrite={true}
            />
        </mesh>
    );
}
