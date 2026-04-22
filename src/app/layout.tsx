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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const previewImage =
  'https://antimatter.vn/wp-content/uploads/2022/06/hinh-anh-da-lat.jpg';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Dalat SmartRoute AI',
    template: '%s | Dalat SmartRoute AI',
  },
  description:
    'Dalat SmartRoute AI - Weather-aware travel recommendations, local insights, and community reviews.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    url: '/',
    title: 'Dalat SmartRoute AI - Discover Dalat Smarter',
    description:
      'Plan your Dalat journey with weather-aware suggestions, local eats, community reviews, and smart route ideas.',
    siteName: 'Dalat SmartRoute AI',
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: 'Dalat pine hills and city view',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dalat SmartRoute AI - Discover Dalat Smarter',
    description:
      'Weather-aware travel recommendations, local insights, and trusted community reviews for Dalat.',
    images: [previewImage],
  },
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
