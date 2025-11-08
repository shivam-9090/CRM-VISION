import './globals.css';
import { AuthProvider } from '@/lib/auth-provider';
import { WebSocketProvider } from '@/lib/websocket-provider';
import { Toaster } from 'react-hot-toast';
import SkipLink from '@/components/ui/SkipLink';
import type { Metadata, Viewport } from 'next';

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
      <body suppressHydrationWarning={true}>
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  )
}
