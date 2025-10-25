import './globals.css';
import { AuthProvider } from '@/lib/auth';

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
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
