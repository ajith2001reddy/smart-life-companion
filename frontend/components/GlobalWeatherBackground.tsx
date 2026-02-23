"use client";

import { useEffect, useRef } from "react";

export type WeatherType = "clear" | "clouds" | "rain" | "thunder" | "fog" | "night";

interface Props {
    type: WeatherType;
}

/* ── Per-weather blob configs ── */
const THEMES: Record<WeatherType, {
    bg: string;
    blobs: { color: string; opacity: number }[];
    speed: number;
}> = {
    clear: {
        bg: "#030d1a",
        blobs: [
            { color: "#c8ff00", opacity: 0.13 },
            { color: "#00aaff", opacity: 0.14 },
            { color: "#ffcc00", opacity: 0.09 },
            { color: "#00ffcc", opacity: 0.07 },
        ],
        speed: 0.28,
    },
    clouds: {
        bg: "#0a0e14",
        blobs: [
            { color: "#5577aa", opacity: 0.16 },
            { color: "#334466", opacity: 0.18 },
            { color: "#778899", opacity: 0.12 },
            { color: "#aabbcc", opacity: 0.08 },
        ],
        speed: 0.18,
    },
    rain: {
        bg: "#040810",
        blobs: [
            { color: "#0044aa", opacity: 0.18 },
            { color: "#002266", opacity: 0.20 },
            { color: "#0066cc", opacity: 0.12 },
            { color: "#00aaff", opacity: 0.08 },
        ],
        speed: 0.35,
    },
    thunder: {
        bg: "#06040e",
        blobs: [
            { color: "#6600cc", opacity: 0.18 },
            { color: "#330088", opacity: 0.22 },
            { color: "#ff4444", opacity: 0.08 },
            { color: "#cc00ff", opacity: 0.10 },
        ],
        speed: 0.45,
    },
    fog: {
        bg: "#0d0e0f",
        blobs: [
            { color: "#778899", opacity: 0.14 },
            { color: "#556677", opacity: 0.16 },
            { color: "#99aabb", opacity: 0.10 },
            { color: "#aabbcc", opacity: 0.07 },
        ],
        speed: 0.10,
    },
    night: {
        bg: "#02020a",
        blobs: [
            { color: "#1a0066", opacity: 0.18 },
            { color: "#000044", opacity: 0.22 },
            { color: "#c8ff00", opacity: 0.05 },
            { color: "#0033aa", opacity: 0.12 },
        ],
        speed: 0.15,
    },
};

/* ── Blob state ── */
interface Blob {
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    color: string;
    opacity: number;
    phase: number;
    phaseSpeed: number;
}

function makeBlobs(
    w: number, h: number,
    blobs: { color: string; opacity: number }[],
    speed: number
): Blob[] {
    return blobs.map((b) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.min(w, h) * (0.35 + Math.random() * 0.3),
        color: b.color,
        opacity: b.opacity,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.003 + Math.random() * 0.004,
    }));
}

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

export default function GlobalWeatherBackground({ type }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const blobsRef = useRef<Blob[]>([]);
    const typeRef = useRef<WeatherType>(type);

    /* Re-init blobs when weather type changes */
    useEffect(() => {
        typeRef.current = type;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const theme = THEMES[type];
        blobsRef.current = makeBlobs(canvas.width, canvas.height, theme.blobs, theme.speed);
    }, [type]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        /* Resize handler */
        function resize() {
            canvas!.width = window.innerWidth;
            canvas!.height = window.innerHeight;
            const theme = THEMES[typeRef.current];
            blobsRef.current = makeBlobs(canvas!.width, canvas!.height, theme.blobs, theme.speed);
        }
        resize();
        window.addEventListener("resize", resize);

        /* Draw loop */
        function draw() {
            const w = canvas!.width, h = canvas!.height;
            const theme = THEMES[typeRef.current];

            /* Background */
            ctx.fillStyle = theme.bg;
            ctx.fillRect(0, 0, w, h);

            /* Blobs */
            for (const blob of blobsRef.current) {
                blob.phase += blob.phaseSpeed;
                const breathe = 1 + Math.sin(blob.phase) * 0.12;
                const r = blob.radius * breathe;
                const opacity = blob.opacity * (0.85 + Math.sin(blob.phase * 0.7) * 0.15);

                const { r: cr, g: cg, b: cb } = hexToRgb(blob.color);

                const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
                grad.addColorStop(0, `rgba(${cr},${cg},${cb},${opacity})`);
                grad.addColorStop(0.5, `rgba(${cr},${cg},${cb},${opacity * 0.4})`);
                grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(blob.x, blob.y, r, r * (0.75 + Math.sin(blob.phase * 0.5) * 0.15), blob.phase * 0.1, 0, Math.PI * 2);
                ctx.fill();

                /* Move */
                blob.x += blob.vx;
                blob.y += blob.vy;

                /* Bounce */
                if (blob.x < -r) blob.x = w + r;
                if (blob.x > w + r) blob.x = -r;
                if (blob.y < -r) blob.y = h + r;
                if (blob.y > h + r) blob.y = -r;
            }

            /* Noise grain overlay */
            addGrain(ctx, w, h, 0.03);

            /* Vignette */
            const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
            vig.addColorStop(0, "rgba(0,0,0,0)");
            vig.addColorStop(1, "rgba(0,0,0,0.55)");
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, w, h);

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full"
            style={{ zIndex: 0 }}
        />
    );
}

/* ── Subtle film grain ── */
let grainCanvas: HTMLCanvasElement | null = null;

function addGrain(ctx: CanvasRenderingContext2D, w: number, h: number, opacity: number) {
    /* Generate grain tile once */
    if (!grainCanvas) {
        grainCanvas = document.createElement("canvas");
        grainCanvas.width = 256;
        grainCanvas.height = 256;
        const gc = grainCanvas.getContext("2d")!;
        const id = gc.createImageData(256, 256);
        for (let i = 0; i < id.data.length; i += 4) {
            const v = Math.random() * 255;
            id.data[i] = v;
            id.data[i + 1] = v;
            id.data[i + 2] = v;
            id.data[i + 3] = 255;
        }
        gc.putImageData(id, 0, 0);
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = "screen";
    const pat = ctx.createPattern(grainCanvas, "repeat")!;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
}