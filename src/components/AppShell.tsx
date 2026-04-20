'use client';

import type { ReactNode } from 'react';

import ChatWidget from '@/components/ChatWidget';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import ScrollToTop from '@/components/ScrollToTop';

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <ChatWidget />
    </>
  );
}
