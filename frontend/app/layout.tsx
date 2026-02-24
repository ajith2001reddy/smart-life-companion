import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
    title: "Smart Life — AI Fitness Coach",
    description: "AI-powered fitness tracking, coaching, and performance analytics.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Smart Life",
    },
};

export const viewport: Viewport = {
    themeColor: "#c8ff00",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Smart Life" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className="bg-black text-white antialiased">
                <AuthProvider>{children}</AuthProvider>

                {/* Register service worker */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(reg) { console.log('SW registered:', reg.scope); })
      .catch(function(err) { console.log('SW failed:', err); });
  });
}
`,
                    }}
                />
            </body>
        </html>
    );
}