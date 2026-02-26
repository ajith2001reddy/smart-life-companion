/** @type {import('next').NextConfig} */
const nextConfig = {

    async headers() {
        return [
            {
                // Apply to all routes
                source: "/(.*)",
                headers: [
                    {
                        // ✅ THIS IS THE FIX:
                        // "same-origin" (Next.js default) blocks Firebase popup from
                        // communicating back to your app window.
                        // "same-origin-allow-popups" allows it.
                        key: "Cross-Origin-Opener-Policy",
                        value: "same-origin-allow-popups",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;