'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import IconNavbar from './components/Cydebar';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

type UserType = 'locador' | 'locatario' | null;

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);

  const publicPaths = ['/login', '/cadastro'];

  useEffect(() => {
    if (publicPaths.includes(pathname)) {
      setLoading(false);
      setUser(null);
      setUserType(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (currentUser) {
        try {
          const db = getFirestore();
          const userRef = doc(db, 'usuarios', currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const tipo = data.tipo;
            if (tipo === 'locador' || tipo === 'locatario') {
              setUserType(tipo);
            } else {
              setUserType(null);
            }
          } else {
            setUserType(null);
          }
        } catch (error) {
          console.error('Erro ao buscar tipo do usuário:', error);
          setUserType(null);
        }
      } else {
        setUserType(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  const showSidebar = user !== null && !publicPaths.includes(pathname);

  return (
    <div className="flex w-full min-h-screen transition-all duration-300 ease-in-out">
      {showSidebar && userType && <IconNavbar userType={userType} />}

      <main
        className={`transition-all duration-300 ease-in-out flex-1 p-6 overflow-auto ${
          showSidebar ? 'pl-20' : 'pl-6'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
