'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
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
  const [aluguels, setAluguels] = useState<Aluguel[]>([]);
  const [userName, setUserName] = useState<string>('Locatario');

  // Estado para token
  const [token, setToken] = useState('');
  const [imovelInfo, setImovelInfo] = useState<any>(null);
  const [erroToken, setErroToken] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const db = getFirestore();

      try {
        // Buscar dados do usuario
        const userRef = doc(db, 'usuarios', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const dados = userSnap.data();
          setUserName(dados.nome || 'Locatario');
        }

        // Buscar alugueis do locatario
        const alugueisRef = collection(db, 'aluguels');
        const alugueisQuery = query(
          alugueisRef,
          where('locatarioId', '==', user.uid)
        );
        const alugueisSnap = await getDocs(alugueisQuery);
        const lista: Aluguel[] = alugueisSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            valor: data.valor,
            pago: data.pago,
            dataVencimento: data.dataVencimento,
            descricao: data.descricao || '',
          };
        });
        setAluguels(lista);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setAluguels([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const verificarToken = async () => {
    if (!token) {
      setErroToken('Digite um token valido.');
      return;
    }

    try {
      const db = getFirestore();
      const q = query(collection(db, 'imoveis'), where('token', '==', token));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setErroToken('Token invalido ou imovel nao encontrado.');
        setImovelInfo(null);
      } else {
        setImovelInfo(snapshot.docs[0].data());
        setErroToken('');
      }
    } catch (e) {
      console.error(e);
      setErroToken('Erro ao buscar imovel.');
      setImovelInfo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Carregando alugueis...
      </div>
    );
  }

  const hoje = new Date();
  const pendentes = aluguels.filter(
    (a) => !a.pago && a.dataVencimento.toDate() >= hoje
  );
  const vencidos = aluguels.filter(
    (a) => !a.pago && a.dataVencimento.toDate() < hoje
  );
  const totalPago = aluguels
    .filter((a) => a.pago)
    .reduce((acc, a) => acc + a.valor, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ola, {userName}!</h1>

      {/* Campo de Token */}
      <div className="mb-6 flex space-x-2">
        <input
          type="text"
          placeholder="Digite o token do imovel"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1 p-2 rounded bg-gray-800 text-white"
        />
        <button
          onClick={verificarToken}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded"
        >
          Verificar
        </button>
      </div>
      {erroToken && <p className="text-red-500 mb-4">{erroToken}</p>}

      {imovelInfo && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-bold">{imovelInfo.nome}</h2>
          <p>{imovelInfo.endereco}</p>
          <p>R$ {imovelInfo.valor.toFixed(2)}</p>
          <p>Status: {imovelInfo.statusAluguel}</p>
        </div>
      )}

      {/* Resumo financeiro */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Pendentes</h2>
          <p className="text-teal-400 text-3xl font-bold">
            {formatarMoeda(pendentes.reduce((acc, a) => acc + a.valor, 0))}
          </p>
          <p>
            {pendentes.length} {pendentes.length === 1 ? 'contrato' : 'contratos'}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Vencidos</h2>
          <p className="text-red-500 text-3xl font-bold">
            {formatarMoeda(vencidos.reduce((acc, a) => acc + a.valor, 0))}
          </p>
          <p>
            {vencidos.length} {vencidos.length === 1 ? 'contrato' : 'contratos'}
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Total Pago</h2>
          <p className="text-green-400 text-3xl font-bold">
            {formatarMoeda(totalPago)}
          </p>
          <p>Ate o momento</p>
        </div>
      </div>

      {/* Lista de Pendentes */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Alugueis Pendentes</h2>
        {pendentes.length === 0 && <p>Nao ha alugueis pendentes.</p>}
        {pendentes.map(({ id, valor, dataVencimento, descricao }) => (
          <div
            key={id}
            className="bg-gray-800 p-4 rounded mb-3 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{descricao || 'Aluguel'}</p>
              <p>Vence em: {format(dataVencimento.toDate(), 'dd/MM/yyyy')}</p>
            </div>
            <p className="text-teal-400 font-bold">{formatarMoeda(valor)}</p>
          </div>
        ))}
      </section>

      {/* Lista de Vencidos */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Alugueis Vencidos</h2>
        {vencidos.length === 0 && <p>Nao ha alugueis vencidos.</p>}
        {vencidos.map(({ id, valor, dataVencimento, descricao }) => (
          <div
            key={id}
            className="bg-gray-800 p-4 rounded mb-3 flex justify-between items-center"
          >
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
