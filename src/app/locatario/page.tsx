'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

interface Aluguel {
  id: string;
  valor: number;
  pago: boolean;
  dataVencimento: any; // Timestamp do Firestore
  descricao?: string;
}

const formatarMoeda = (valor: number) =>
  `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function LocatarioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alugueis, setAlugueis] = useState<Aluguel[]>([]);
  const [userName, setUserName] = useState<string>('Locatário');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const db = getFirestore();

      // Buscar nome do usuário
      try {
        const userDoc = await getDocs(
          query(collection(db, 'usuarios'), where('uid', '==', user.uid))
        );

        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          setUserName(userData.nome || 'Locatário');
        }
      } catch {
        setUserName('Locatário');
      }

      // Buscar aluguéis do locatário
      try {
        // Supondo que os aluguéis têm um campo 'locatarioId' que referencia o uid do usuário
        const alugueisQuery = query(
          collection(db, 'aluguéis'),
          where('locatarioId', '==', user.uid)
        );
        const alugueisSnapshot = await getDocs(alugueisQuery);

        const alugs: Aluguel[] = alugueisSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            valor: data.valor,
            pago: data.pago,
            dataVencimento: data.dataVencimento,
            descricao: data.descricao || '',
          };
        });

        setAlugueis(alugs);
      } catch (error) {
        console.error('Erro ao buscar aluguéis:', error);
        setAlugueis([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Carregando aluguéis...
      </div>
    );
  }

  const hoje = new Date();

  const aluguéisPendentes = alugueis.filter(a => !a.pago && a.dataVencimento.toDate() >= hoje);
  const aluguéisVencidos = alugueis.filter(a => !a.pago && a.dataVencimento.toDate() < hoje);
  const totalPago = alugueis.filter(a => a.pago).reduce((acc, a) => acc + a.valor, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Olá, {userName}!</h1>

      {/* Resumo */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Aluguéis Pendentes</h2>
          <p className="text-teal-400 text-3xl font-bold">
            {formatarMoeda(
              aluguéisPendentes.reduce((acc, a) => acc + a.valor, 0)
            )}
          </p>
          <p>{aluguéisPendentes.length} {aluguéisPendentes.length === 1 ? 'contrato' : 'contratos'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Aluguéis Vencidos</h2>
          <p className="text-red-500 text-3xl font-bold">
            {formatarMoeda(
              aluguéisVencidos.reduce((acc, a) => acc + a.valor, 0)
            )}
          </p>
          <p>{aluguéisVencidos.length} {aluguéisVencidos.length === 1 ? 'contrato' : 'contratos'}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Total Pago</h2>
          <p className="text-green-400 text-3xl font-bold">{formatarMoeda(totalPago)}</p>
          <p>Até o momento</p>
        </div>
      </div>

      {/* Listas */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Aluguéis Pendentes</h2>
        {aluguéisPendentes.length === 0 && <p>Não há aluguéis pendentes.</p>}

        {aluguéisPendentes.map(({ id, valor, dataVencimento, descricao }) => (
          <div key={id} className="bg-gray-800 p-4 rounded mb-3 flex justify-between items-center">
            <div>
              <p className="font-semibold">{descricao || 'Aluguel'}</p>
              <p>Vence em: {format(dataVencimento.toDate(), 'dd/MM/yyyy')}</p>
            </div>
            <p className="text-teal-400 font-bold">{formatarMoeda(valor)}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Aluguéis Vencidos</h2>
        {aluguéisVencidos.length === 0 && <p>Não há aluguéis vencidos.</p>}

        {aluguéisVencidos.map(({ id, valor, dataVencimento, descricao }) => (
          <div key={id} className="bg-gray-800 p-4 rounded mb-3 flex justify-between items-center">
            <div>
              <p className="font-semibold">{descricao || 'Aluguel'}</p>
              <p>Venceu em: {format(dataVencimento.toDate(), 'dd/MM/yyyy')}</p>
            </div>
            <p className="text-red-500 font-bold">{formatarMoeda(valor)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
