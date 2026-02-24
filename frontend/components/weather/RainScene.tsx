"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function RainParticles() {
    const pointsRef = useRef<THREE.Points>(null!);
    const texture = useLoader(THREE.TextureLoader, "/textures/raindrop.png");

    const count = 7000;

    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 80;
            arr[i * 3 + 1] = Math.random() * 60;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }

        return arr;
    }, []);

    useFrame(() => {
        const geometry = pointsRef.current.geometry;
        const attr = geometry.attributes.position;

        for (let i = 0; i < count; i++) {
            attr.array[i * 3 + 1] -= 0.7;

            if (attr.array[i * 3 + 1] < -30) {
                attr.array[i * 3 + 1] = 30;
            }
        }

        attr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>

            <pointsMaterial
                map={texture}
                alphaMap={texture}
                size={0.07}          // 👈 smaller droplets
                transparent
                depthWrite={false}
                opacity={0.55}
                color="#ffffff"
                sizeAttenuation      // important for depth realism
            />

        </points>
    );
}

export default function RainScene() {
    return (
        <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
            <fog attach="fog" args={["#000000", 10, 100]} />
            <RainParticles />
        </Canvas>
    );
}
