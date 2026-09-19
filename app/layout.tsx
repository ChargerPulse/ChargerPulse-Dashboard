import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "../components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "ChargerPulse — Real-Time EV Charger Monitoring",
  description: "Monitor your EV charging infrastructure 24/7. Get instant alerts when chargers go offline. Built for fleet managers, depot operators and charging network providers. Free 7-day trial.",
  keywords: "EV charger monitoring, electric vehicle charging, fleet management, OCPP monitoring, charger uptime, EV fleet South Africa, charging station alerts",
  authors: [{ name: "ChargerPulse" }],
  manifest: "/manifest.json",
  openGraph: {
    title: "ChargerPulse — Real-Time EV Charger Monitoring",
    description: "Know when your EV chargers go down before your drivers do. 24/7 monitoring with instant email alerts.",
    url: "https://chargerpulse-dashboard.onrender.com",
    siteName: "ChargerPulse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChargerPulse — Real-Time EV Charger Monitoring",
    description: "Know when your EV chargers go down before your drivers do. 24/7 monitoring with instant email alerts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0d1421" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ChargerPulse" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}