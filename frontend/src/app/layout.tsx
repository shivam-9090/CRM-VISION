import './globals.css';
import { AuthProvider } from '@/lib/auth-provider';
import { Manrope } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'CRM Vision — Revenue clarity for focused teams',
    template: '%s | CRM Vision',
  },
  description: 'Connect deals, contacts, companies and customer activity in one clear revenue workspace.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.variable} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
