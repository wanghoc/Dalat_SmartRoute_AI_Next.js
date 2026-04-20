import type { Metadata } from 'next';
import { Manrope, Tenor_Sans } from 'next/font/google';

import Providers from '@/components/Providers';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-manrope-family',
});

const tenorSans = Tenor_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-tenor-family',
});

export const metadata: Metadata = {
  title: 'Dalat SmartRoute AI',
  description:
    'Dalat SmartRoute AI - Weather-aware travel recommendations, local insights, and community reviews.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${tenorSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
