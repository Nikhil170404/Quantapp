import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuantApp - Quantitative Trading Dashboard',
  description: 'Real-time stock analysis with technical indicators, risk scoring, and automated signals',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
