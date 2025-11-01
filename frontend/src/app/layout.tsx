import './globals.css';
import { AuthProvider } from '@/lib/auth-provider';
import { WebSocketProvider } from '@/lib/websocket-provider';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'CRM System',
  description: 'Modern CRM application for managing customers and deals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <Toaster />
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
