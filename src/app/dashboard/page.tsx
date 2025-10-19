'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login'); // redireciona quem não estiver logado
      } else {
        setLoading(false); // usuário autenticado, mostra a página
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Resumo rápido dos seus alugueis e produtos.</p>
      {/* Aqui pode entrar cards e gráficos futuramente */}
    </div>
  );
}
