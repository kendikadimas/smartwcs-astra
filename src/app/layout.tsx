import type { Metadata } from 'next';
// Font Geist dibundel lewat paket `geist` (next/font/local) supaya build tidak perlu
// mengunduh dari Google Fonts -- sesuai deployment on-premise/LAN-first (ADR Section 7).
// Nama CSS variable tetap --font-geist-sans / --font-geist-mono.
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'SYNTRA Smart WCS Platform',
  description: 'Enterprise Smart Warehouse Control System — Astra Otoparts (Divisi Winteq)',
  icons: {
    icon: [
      { url: '/images/wcslogo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/images/wcslogo.png', type: 'image/png' },
    ],
    shortcut: ['/images/wcslogo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
