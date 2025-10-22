'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import { FaPlus, FaSearch, FaUserCircle } from 'react-icons/fa';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

interface Aluguel {
  id: string;
  valor: number;
  pago: boolean;
  dataVencimento: Timestamp;
}

const formatarMoeda = (valor: number) =>
  `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function calcularTotalRecebido(alugueis: Aluguel[]) {
  return alugueis.filter(a => a.pago).reduce((acc, a) => acc + a.valor, 0);
}

function calcularTotalPendente(alugueis: Aluguel[]) {
  return alugueis.filter(a => !a.pago).reduce((acc, a) => acc + a.valor, 0);
}

function gerarDadosGrafico(alugueis: Aluguel[]) {
  const meses = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  return meses.map((mes) => ({ mes, valor: 0 }));
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [alugueis, setAlugueis] = useState<Aluguel[]>([]);
  const [userName, setUserName] = useState<string>('Gestor');

  async function carregarDados(userId: string) {
    setLoading(true);
    try {
      setUserName('Gestor');
      setAlugueis([]); // Aqui você carrega os dados reais depois
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        carregarDados(user.uid);
      } else {
        setUserName('Visitante');
        setAlugueis([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const totalRecebido = calcularTotalRecebido(alugueis);
  const totalPendente = calcularTotalPendente(alugueis);
  const dadosGrafico = gerarDadosGrafico(alugueis);
  const porcentagemProjecao = 0;

  if (loading) {
    return (
      <div className="text-white bg-gray-900 min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pt-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard de Aluguéis</h1>

        <div className="flex items-center space-x-6">
          {/* Busca */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Buscar Contrato/Locatário"
              className="bg-gray-800 text-gray-300 rounded-lg pl-10 pr-4 py-2 border border-gray-700 w-64"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Nome do usuário */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <p className="text-base text-gray-200 font-medium">Olá,</p>
              <p className="text-lg text-white font-extrabold -mt-1">{userName}!</p>
            </div>
            <FaUserCircle size={40} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Gráfico */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Fluxo de Aluguéis</h2>
              <span className="text-sm text-teal-400 hover:underline cursor-pointer">Ver Todos</span>
            </div>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                  <XAxis dataKey="mes" stroke="#9ca3af" />
                  <YAxis
                    tickFormatter={(v) => (v === 0 ? '0k$' : `${(v / 1000).toFixed(1)}k$`)}
                    stroke="#9ca3af"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }}
                    formatter={(value: number) => [formatarMoeda(value), 'Recebido']}
                  />
                  <Bar dataKey="valor" fill="#14b8a6" radius={[6, 6, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resumo lateral */}
        <div className="space-y-8">
          {/* Resumo financeiro */}
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

          {/* Projeção */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Projeção Mensal</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-grow bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-teal-500 h-6 rounded-full transition-all duration-500"
                  style={{ width: `${porcentagemProjecao}%` }}
                ></div>
              </div>
              <span className="text-teal-400 font-bold">{porcentagemProjecao}%</span>
            </div>
          </div>

          {/* Botão novo contrato */}
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
