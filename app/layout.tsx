import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChargerPulse",
  description: "EV Charger Uptime Analytics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}