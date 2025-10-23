import './globals.css';
import SidebarWrapper from './SidebarWrapper';
import { UserProvider } from '@/context/UserContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="flex bg-gray-50 min-h-screen">
        <UserProvider>
          <SidebarWrapper>{children}</SidebarWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
