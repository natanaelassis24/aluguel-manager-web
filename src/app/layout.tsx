'use client';

import './globals.css';
import SidebarWrapper from './SidebarWrapper';
import { UserProvider } from '@/context/UserContext';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
          <SidebarWrapper>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname || 'root'} // 👈 evita erro quando pathname é undefined
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ width: '100%' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </SidebarWrapper>
        </UserProvider>
      </body>
    </html>
  );
}
