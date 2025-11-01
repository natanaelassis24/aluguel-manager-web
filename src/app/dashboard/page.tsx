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
  Timestamp,
} from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FaPlus, FaSearch, FaUserCircle } from 'react-icons/fa';

// Tipagem
interface Pagamento {
  id: string;
  valorPago: number;
  status: 'PAGO' | 'PENDENTE';
  dataPagamento: any;
}

const formatarMoeda = (valor: number) =>
  `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const router = useRouter();
  const db = getFirestore();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Gestor');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  async function carregarDados(userId: string) {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      if (userDoc.exists()) setUserName(userDoc.data().nome || 'Gestor');

      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      const seisMesesTimestamp = Timestamp.fromDate(seisMesesAtras);

      const pagamentosQuery = query(
        collection(db, 'pagamentos'),
        where('idUsuario', '==', userId),
        where('dataPagamento', '>=', seisMesesTimestamp)
      );
      const snap = await getDocs(pagamentosQuery);
      const lista: Pagamento[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Pagamento[];

      setPagamentos(lista);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (!userDoc.exists()) {
        router.push('/login');
        return;
      }

      const tipo = userDoc.data().tipo;
      if (tipo !== 'locador') {
        router.push('/locatario');
        return;
      }

      carregarDados(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const totalRecebido = pagamentos
    .filter((p) => p.status === 'PAGO')
    .reduce((acc, p) => acc + p.valorPago, 0);

  const totalPendente = pagamentos
    .filter((p) => p.status === 'PENDENTE')
    .reduce((acc, p) => acc + p.valorPago, 0);

  const gerarDadosGrafico = () => {
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleString('pt-BR', { month: 'short' });
    });

    const dados = meses.map((mes) => ({ mes, valor: 0 }));

    pagamentos.forEach((p) => {
      if (p.status === 'PAGO' && p.dataPagamento?.seconds) {
        const data = new Date(p.dataPagamento.seconds * 1000);
        const nomeMes = data.toLocaleString('pt-BR', { month: 'short' });
        const item = dados.find((d) => d.mes === nomeMes);
        if (item) item.valor += p.valorPago;
      }
    });

    return dados;
  };

  const dadosGrafico = gerarDadosGrafico();
  const porcentagemProjecao =
    totalRecebido > 0
      ? Math.min(100, (totalRecebido / (totalRecebido + totalPendente)) * 100)
      : 0;

  if (loading) {
    return (
      <div className="text-white bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Coluna esquerda - conteúdo principal */}
        <div className="w-full lg:flex-1 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 pt-4">
            <h1 className="text-3xl font-bold text-white">Dashboard de Aluguéis</h1>
            <div className="flex items-center space-x-6">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Buscar Contrato/Locatário"
                  className="bg-gray-800 text-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-teal-500 focus:border-teal-500 border border-gray-700 w-64"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <p className="text-base text-gray-200 font-medium">Olá,</p>
                  <p className="text-lg text-white font-extrabold -mt-1">{userName}!</p>
                </div>
                <FaUserCircle size={40} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Fluxo de Aluguéis</h2>
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                  <XAxis dataKey="mes" stroke="#9ca3af" axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(1)}k`}
                    stroke="#9ca3af"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    formatter={(v: number) => [formatarMoeda(v), 'Recebido']}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={30} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Coluna direita - resumo financeiro e projeção */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-8">
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resumo Financeiro</h3>
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between text-gray-400">
                <span>Total Recebido</span>
                <span className="text-teal-400 font-semibold">{formatarMoeda(totalRecebido)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Total Pendente</span>
                <span className="text-red-500 font-semibold">{formatarMoeda(totalPendente)}</span>
              </div>
              <div className="flex justify-between text-gray-400 border-t border-gray-700 pt-4 font-bold text-white">
                <span>Saldo Atual</span>
                <span>{formatarMoeda(totalRecebido - totalPendente)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Projeção Mensal</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-grow bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-teal-500 h-6 rounded-full transition-all duration-500"
                  style={{ width: `${porcentagemProjecao}%` }}
                ></div>
              </div>
              <span className="text-teal-400 font-bold">{porcentagemProjecao.toFixed(0)}%</span>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-500 transition"
            onClick={() => alert('Abrir formulário de novo contrato')}
          >
            <FaPlus size={20} />
            <span>Novo Contrato</span>
          </button>
        </div>
      </div>
    </div>
  );
}
