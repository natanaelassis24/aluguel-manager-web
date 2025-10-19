import './globals.css';
import SidebarWrapper from './SidebarWrapper';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex bg-gray-50 min-h-screen">
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
