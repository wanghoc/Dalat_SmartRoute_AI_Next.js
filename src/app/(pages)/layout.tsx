import type { ReactNode } from 'react';

import AppShell from '@/components/AppShell';

type PagesLayoutProps = {
  children: ReactNode;
};

export default function PagesLayout({ children }: PagesLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
