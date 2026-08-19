import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sarh',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'سرح | لوحة الملاحم',
  description: 'لوحة تحكم الملاحم في منصة سرح',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className={`${plex.className} min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
