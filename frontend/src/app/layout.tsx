import './globals.css';
import { Providers } from './providers';
import { WebSocketProvider } from '@/lib/websocket-provider';
import { Toaster } from 'react-hot-toast';
import SkipLink from '@/components/ui/SkipLink';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CRM System',
  description: 'Modern CRM application for managing customers and deals',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <Providers>
          <WebSocketProvider>
            <div id="main-content">
              {children}
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                ariaProps: {
                  role: 'status',
                  'aria-live': 'polite',
                },
              }}
            />
          </WebSocketProvider>
        </Providers>
      </body>
    </html>
  )
}
