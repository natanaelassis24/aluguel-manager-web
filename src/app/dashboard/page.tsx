'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Aluguel {
  id: string;
  valor: number;
  pago: boolean;
  dataVencimento: Timestamp;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alugueis, setAlugueis] = useState<Aluguel[]>([]);

  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalPendente, setTotalPendente] = useState(0);
  const [totalAlugueis, setTotalAlugueis] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        carregarDados();
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function carregarDados() {
    setLoading(true);

    try {
      const q = query(collection(firestore, 'alugueis'));
      const querySnapshot = await getDocs(q);

      const alugueisData: Aluguel[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        alugueisData.push({
          id: doc.id,
          valor: data.valor,
          pago: data.pago,
          dataVencimento: data.dataVencimento,
        });
      });

      setAlugueis(alugueisData);
      setTotalAlugueis(alugueisData.length);

      const recebido = alugueisData
        .filter(a => a.pago)
        .reduce((acc, a) => acc + a.valor, 0);
      const pendente = alugueisData
        .filter(a => !a.pago)
        .reduce((acc, a) => acc + a.valor, 0);

      setTotalRecebido(recebido);
      setTotalPendente(pendente);

    } catch (error) {
      console.error('Erro ao carregar alugueis:', error);
    }

    setLoading(false);
  }

  // Gera dados reais para o gráfico a partir dos aluguéis pagos agrupados por mês e ano
  function gerarDadosGrafico(alugueis: Aluguel[]) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const valoresPorMesAno: Record<string, number> = {};

    alugueis.forEach((a) => {
      if (a.pago && a.dataVencimento) {
        const data = a.dataVencimento.toDate();
        const mes = data.getMonth();
        const ano = data.getFullYear();
        const chave = `${mes}-${ano}`;

        if (!valoresPorMesAno[chave]) {
          valoresPorMesAno[chave] = 0;
        }
        valoresPorMesAno[chave] += a.valor;
      }
    });

    const dados = Object.entries(valoresPorMesAno)
      .map(([chave, valor]) => {
        const [mes, ano] = chave.split('-').map(Number);
        return { mes, ano, valor };
      })
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mes - b.mes;
      })
      .map(({ mes, ano, valor }) => ({
        mes: `${meses[mes]}/${ano}`,
        valor,
      }));

    return dados;
  }

  const dadosGrafico = gerarDadosGrafico(alugueis);

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Total de Aluguéis</h2>
          <p className="text-2xl">{totalAlugueis}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Recebido</h2>
          <p className="text-2xl text-green-600">R$ {totalRecebido.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Pendente</h2>
          <p className="text-2xl text-red-600">R$ {totalPendente.toFixed(2)}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-6 rounded shadow mb-8" style={{ height: '300px', minHeight: '250px' }}>
        <h2 className="text-lg font-semibold mb-4">Recebimentos nos últimos meses</h2>
        {dadosGrafico.length === 0 ? (
          <p className="text-center text-gray-500">Sem dados para mostrar no gráfico.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Bar dataKey="valor" fill="#3182ce" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Lista de Pendentes */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Aluguéis Pendentes</h2>
        {alugueis.filter(a => !a.pago).length === 0 ? (
          <p>Sem alugueis pendentes 🎉</p>
        ) : (
          <ul>
            {alugueis
              .filter(a => !a.pago)
              .map((a) => (
                <li key={a.id} className="mb-2 border-b border-gray-200 pb-2 break-words">
                  Valor: R$ {a.valor.toFixed(2)} — Vencimento:{' '}
                  {a.dataVencimento.toDate().toLocaleDateString()}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
