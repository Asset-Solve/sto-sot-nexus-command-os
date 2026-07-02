import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'STO/SOT Platform — Turnaround Command & Control',
  description: 'Enterprise shutdown, outage and turnaround operating platform with clean-core SAP orchestration.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
