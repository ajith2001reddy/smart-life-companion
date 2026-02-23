const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ================= WEATHER ================= */

export async function getWeather(city: string) {
    const res = await fetch(`${BASE_URL}/api/weather?city=${city}`);

    if (!res.ok) {
        throw new Error("Failed to fetch weather");
    }

    return res.json();
}

/* ================= GENERATE PLAN ================= */

export async function generatePlan(data: {
    mode: "smart" | "pro";
    goal: string;
    days: number;
    bmi?: number;
}) {
    const res = await fetch(`${BASE_URL}/api/generate-plan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("Plan generation failed");
    }

    return res.json();
}

/* ================= AI COACH ================= */

export async function chatWithCoach(messages: any[]) {
    const res = await fetch(`${BASE_URL}/api/coach`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
        throw new Error("Coach request failed");
    }

    return res.json();
}
