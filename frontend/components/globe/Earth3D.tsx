"use client";

import {
    Canvas,
    useFrame,
    useLoader,
    extend,
} from "@react-three/fiber";
import {
    OrbitControls,
    Stars,
    shaderMaterial,
    Sphere,
} from "@react-three/drei";
import {
    EffectComposer,
    Bloom,
    ChromaticAberration,
    Vignette,
} from "@react-three/postprocessing";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { Vector2 } from "three";

/* =========================================================
   R3F TYPE AUGMENTATION
========================================================= */

declare module "@react-three/fiber" {
    interface ThreeElements {
        terminatorMaterial: any;
        atmosphereMaterial: any;
    }
}

/* =========================================================
   ATMOSPHERE SHADER
========================================================= */

const AtmosphereMaterial = shaderMaterial(
    {
        color: new THREE.Color(0.25, 0.55, 1.0),
        power: 5.0,
        intensity: 1.0,
        time: 0,
    },
    `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  void main() {
    vNormal  = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mvPos;
  }
  `,
    `
  uniform vec3 color;
  uniform float power;
  uniform float intensity;
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), power);
    float lat = abs(normalize(vWorldPos).y);
    vec3 auroraColor = mix(
      color,
      vec3(0.1, 1.0, 0.6),
      smoothstep(0.6, 0.95, lat) * 0.35 *
      (sin(time * 0.7 + vWorldPos.x * 3.0) * 0.5 + 0.5)
    );
    gl_FragColor = vec4(auroraColor, fresnel * intensity);
  }
  `
);

extend({ AtmosphereMaterial });

/* =========================================================
   TERMINATOR SHADER
========================================================= */

const TerminatorMaterial = shaderMaterial(
    {
        dayMap: null,
        nightMap: null,
        cloudMap: null,
        sunDirection: new THREE.Vector3(1, 0, 0),
        time: 0,
    },
    `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
    `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D cloudMap;
  uniform vec3 sunDirection;
  uniform float time;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec4 dayColor   = texture2D(dayMap,   vUv);
    vec4 nightColor = texture2D(nightMap, vUv);
    vec4 cloudColor = texture2D(cloudMap, vUv);

    float NdotL = dot(vWorldNormal, normalize(sunDirection));
    float blend = smoothstep(-0.18, 0.28, NdotL);

    // FIX: clamp day brightness so it never blows out
    vec3 day   = dayColor.rgb * clamp(NdotL * 0.85 + 0.15, 0.0, 1.0);
    vec3 night = nightColor.rgb * 0.85;

    vec3 surface = mix(night, day, blend);

    // Subtle ocean specular
    float oceanMask = clamp(dayColor.b - dayColor.r * 0.5, 0.0, 1.0);
    float spec = pow(max(NdotL, 0.0), 48.0) * oceanMask * 0.6;
    surface += vec3(spec * 0.2, spec * 0.3, spec * 0.5);

    surface += cloudColor.rgb * 0.25 * blend;

    gl_FragColor = vec4(surface, 1.0);
  }
  `
);

extend({ TerminatorMaterial });

/* =========================================================
   SUN  — reduced intensity to prevent washout
========================================================= */

function Sun({ sunDir }: { sunDir: THREE.Vector3 }) {
    const ref = useRef<THREE.DirectionalLight | null>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime() * 0.035;
        const pos = new THREE.Vector3(
            Math.sin(t) * 20,
            3 + Math.sin(t * 0.4) * 3,
            Math.cos(t) * 20
        );
        ref.current?.position.copy(pos);
        sunDir.copy(pos).normalize();
    });

    return (
        <>
            {/* FIX: was 4.2 — way too bright, caused day-side white-out */}
            <directionalLight ref={ref} intensity={2.2} color="#fff6e0" />
            <ambientLight intensity={0.04} color="#0a1530" />
        </>
    );
}

/* =========================================================
   SATELLITES
   FIX 1: useRef must NOT be called inside .map() — hooks violation
   FIX 2: separate meshRefs and lineRefs so they don't conflict
   FIX 3: trail geometry updated on the correct line object
========================================================= */

const SAT_CONFIGS = [
    { radius: 6.4, speed: 0.22 },
    { radius: 7.1, speed: 0.15 },
    { radius: 5.9, speed: 0.31 },
];

// Trail line objects created once outside the component
const trailLines = SAT_CONFIGS.map(() =>
    new THREE.Line(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
            color: "#4488ff",
            transparent: true,
            opacity: 0.25,
        })
    )
);

function Satellites() {
    // FIX: declare refs individually — never inside .map()
    const meshRef0 = useRef<THREE.Mesh>(null!);
    const meshRef1 = useRef<THREE.Mesh>(null!);
    const meshRef2 = useRef<THREE.Mesh>(null!);
    const meshRefs = [meshRef0, meshRef1, meshRef2];

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();

        SAT_CONFIGS.forEach((cfg, i) => {
            const angle = t * cfg.speed;
            const x = Math.cos(angle) * cfg.radius;
            const z = Math.sin(angle) * cfg.radius;

            // Move satellite mesh
            if (meshRefs[i].current) {
                meshRefs[i].current.position.set(x, 0, z);
            }

            // FIX: update trail on the actual line object, not the mesh ref
            const positions = new Float32Array(60);
            for (let j = 0; j < 20; j++) {
                const a = angle - j * 0.15;
                positions[j * 3] = Math.cos(a) * cfg.radius;
                positions[j * 3 + 1] = 0;
                positions[j * 3 + 2] = Math.sin(a) * cfg.radius;
            }
            trailLines[i].geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
            );
            trailLines[i].geometry.attributes.position.needsUpdate = true;
        });
    });

    return (
        <>
            {SAT_CONFIGS.map((_, i) => (
                <group key={i}>
                    <mesh ref={meshRefs[i]}>
                        <boxGeometry args={[0.12, 0.05, 0.24]} />
                        <meshStandardMaterial
                            color="#c0d4e8"
                            emissive="#445566"
                            emissiveIntensity={1.5}
                            metalness={0.9}
                            roughness={0.1}
                        />
                    </mesh>
                    {/* FIX: primitive uses its own trailLines object, no ref conflict */}
                    <primitive object={trailLines[i]} />
                </group>
            ))}
        </>
    );
}

/* =========================================================
   EARTH MESH
========================================================= */

function EarthMesh({ sunDir }: { sunDir: THREE.Vector3 }) {
    const [dayMap, nightMap, cloudMap] = useLoader(THREE.TextureLoader, [
        "/textures/earth.jpg",
        "/textures/earth_lights.png",
        "/textures/earth_clouds.png",
    ]);

    [dayMap, nightMap, cloudMap].forEach(t => {
        t.anisotropy = 16;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
    });

    const matRef = useRef<any>(null);
    const atmRef = useRef<any>(null);
    const cloudRef = useRef<THREE.Mesh>(null!);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (matRef.current) {
            matRef.current.uniforms.sunDirection.value.copy(sunDir);
            matRef.current.uniforms.time.value = t;
        }
        if (atmRef.current) {
            atmRef.current.uniforms.time.value = t;
        }
        if (cloudRef.current) {
            cloudRef.current.rotation.y += 0.00035;
        }
    });

    return (
        <>
            {/* Earth surface */}
            <Sphere args={[5, 256, 256]}>
                <terminatorMaterial
                    ref={matRef}
                    dayMap={dayMap}
                    nightMap={nightMap}
                    cloudMap={cloudMap}
                    sunDirection={sunDir}
                />
            </Sphere>

            {/* Rotating cloud layer */}
            <mesh ref={cloudRef}>
                <sphereGeometry args={[5.055, 128, 128]} />
                <meshStandardMaterial
                    map={cloudMap}
                    transparent
                    opacity={0.18}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Atmosphere glow */}
            <Sphere args={[5.22, 128, 64]}>
                <atmosphereMaterial
                    ref={atmRef}
                    color={new THREE.Color(0.3, 0.6, 1)}
                    power={5.0}
                    intensity={0.9}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.FrontSide}
                />
            </Sphere>

            {/* Outer faint corona */}
            <Sphere args={[5.6, 64, 32]}>
                <atmosphereMaterial
                    color={new THREE.Color(0.08, 0.22, 0.85)}
                    power={7.0}
                    intensity={0.22}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.FrontSide}
                />
            </Sphere>
        </>
    );
}

/* =========================================================
   MAIN
========================================================= */

export default function Earth3D() {
    const sunDir = useMemo(() => new THREE.Vector3(1, 0, 0), []);

    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [0, 2, 14], fov: 36 }}
                gl={{
                    antialias: true,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    // FIX: reduced from default 1.0 — prevents day-side overexposure
                    toneMappingExposure: 0.7,
                }}
                dpr={[1, 2]}
            >
                <color attach="background" args={["#01010a"]} />

                <Stars radius={300} depth={80} count={12000} factor={4} fade />
                <Stars radius={80} depth={20} count={2000} factor={2.5} fade />

                <Sun sunDir={sunDir} />

                <Suspense fallback={null}>
                    <EarthMesh sunDir={sunDir} />
                    <Satellites />
                </Suspense>

                <EffectComposer>
                    {/* FIX: was intensity=1.5 with no threshold — bloomed everything white
                        Now only blooms very bright emissives (city lights, atmosphere edge) */}
                    <Bloom
                        intensity={0.35}
                        luminanceThreshold={0.85}
                        luminanceSmoothing={0.6}
                        mipmapBlur
                        radius={0.4}
                    />
                    <ChromaticAberration offset={new Vector2(0.0003, 0.0003)} />
                    <Vignette eskil={false} offset={0.14} darkness={0.75} />
                </EffectComposer>

                <OrbitControls
                    autoRotate
                    autoRotateSpeed={0.4}
                    enableZoom
                    enablePan={false}
                    minDistance={7}
                    maxDistance={28}
                    dampingFactor={0.05}
                    enableDamping
                />
            </Canvas>
        </div>
    );
}