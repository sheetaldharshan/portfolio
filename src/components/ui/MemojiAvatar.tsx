"use client";
import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, Environment, ContactShadows, useTexture } from "@react-three/drei";

function MemojiScene({ isHovered }: { isHovered: boolean }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = useTexture("/memoji.svg");

    useFrame((state) => {
        if (!meshRef.current) return;

        // Mouse tracking for 3D tilt
        const targetX = isHovered ? -state.mouse.y * 0.4 : 0;
        const targetY = isHovered ? state.mouse.x * 0.4 : 0;

        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetX, 0.1);
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetY, 0.1);

        // Subtle constant sway
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh ref={meshRef}>
                    <circleGeometry args={[3.8, 64]} />
                    <meshStandardMaterial
                        map={texture}
                        transparent
                        side={THREE.DoubleSide}
                        roughness={0.1}
                        metalness={0.2}
                    />
                </mesh>
            </Float>

            <ContactShadows
                position={[0, -3, 0]}
                opacity={0.4}
                scale={10}
                blur={2.5}
                far={4.5}
            />
            <Environment preset="city" />
        </>
    );
}

export const MemojiAvatar = ({ className }: { className?: string }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className={`relative w-24 h-24 md:w-36 md:h-36 transition-transform duration-500 hover:scale-105 cursor-pointer ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Canvas
                shadows
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <React.Suspense fallback={null}>
                    <MemojiScene isHovered={isHovered} />
                </React.Suspense>
            </Canvas>

        </div>
    );
};
