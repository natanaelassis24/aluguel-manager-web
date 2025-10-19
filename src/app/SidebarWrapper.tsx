'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cydebar from './components/Cydebar';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const publicPaths = ['/login', '/cadastro'];

  useEffect(() => {
    if (publicPaths.includes(pathname)) {
      setLoading(false);
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  const showSidebar = user !== null && !publicPaths.includes(pathname);

  return (
    <>
      {showSidebar && <Cydebar />}
      <main
        className="flex-1 p-6 overflow-auto"
        style={{ marginLeft: showSidebar ? '16rem' : 0 }}
      >
        {children}
      </main>
    </>
  );
}
