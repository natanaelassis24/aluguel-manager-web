'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { CreditCard, DollarSign } from 'lucide-react';

export default function PagamentosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [imovel, setImovel] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<'PIX' | 'BOLETO' | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const db = getFirestore();

  // 🔹 Verifica login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push('/login');
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  // 🔹 Busca imóvel
  const buscarImovel = async (tokenBusca?: string) => {
    const tokenFinal = tokenBusca || token;
    if (!tokenFinal.trim()) {
      setErro('Digite um token válido.');
      return;
    }

    try {
      const q = query(collection(db, 'imoveis'), where('token', '==', tokenFinal));
      const snap = await getDocs(q);
      if (snap.empty) {
        setErro('Imóvel não encontrado.');
        setImovel(null);
        return;
      }
      setErro('');
      setImovel(snap.docs[0].data());
    } catch (e) {
      console.error(e);
      setErro('Erro ao buscar imóvel.');
      setImovel(null);
    }
  };

  // 🔹 Carrega token salvo
  useEffect(() => {
    const salvo = localStorage.getItem('tokenImovel');
    if (salvo) {
      setToken(salvo);
      buscarImovel(salvo);
    }
  }, []);

  // 🔹 Gera pagamento
  const gerarPagamento = async (tipo: 'PIX' | 'BOLETO') => {
    if (!imovel) {
      setErro('Busque o imóvel antes de gerar pagamento.');
      return;
    }
    if (!user) {
      setErro('Usuário não autenticado.');
      return;
    }

    setMetodo(tipo);
    setErro('');
    setLinkPagamento(null);

    try {
      const res = await fetch('/api/cobranca/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: imovel.valor,
          descricao: imovel.nome,
          tipo,
          email: user.email,
          nome: user.displayName || 'Locatário',
          tokenImovel: token,
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setLinkPagamento(data.url);
        setHistorico((prev) => [
          ...prev,
          {
            tipo,
            valor: Number(imovel.valor),
            data: new Date().toLocaleDateString('pt-BR'),
            link: data.url,
          },
        ]);
      } else {
        setErro(data?.message || 'Erro ao gerar pagamento.');
      }
    } catch (e) {
      console.error(e);
      setErro('Falha ao gerar pagamento.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0d1721] text-white p-6 sm:ml-[80px]">
      {/* Cabeçalho */}
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-teal-400 mb-1">
          Pagamentos
        </h1>
        <p className="text-gray-400">
          Gere PIX ou Boleto e acompanhe seus pagamentos.
        </p>
      </header>

      {/* Campo de Token */}
      <section className="flex flex-wrap gap-2 mb-6 justify-center sm:justify-start">
        <input
          type="text"
          placeholder="Digite o token do imóvel"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1 min-w-[240px] max-w-md p-2 rounded bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={() => buscarImovel()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded transition"
        >
          Buscar
        </button>
      </section>

      {/* 🔹 BOTÕES GRANDES E PADRÃO TEAL */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => gerarPagamento('PIX')}
          className="flex items-center justify-center gap-3 py-6 bg-teal-600 hover:bg-teal-500 rounded-xl text-xl font-semibold transition shadow-lg"
        >
          <DollarSign className="w-6 h-6" />
          Gerar PIX
        </button>
        <button
          onClick={() => gerarPagamento('BOLETO')}
          className="flex items-center justify-center gap-3 py-6 bg-teal-600 hover:bg-teal-500 rounded-xl text-xl font-semibold transition shadow-lg"
        >
          <CreditCard className="w-6 h-6" />
          Gerar Boleto
        </button>
      </section>

      {erro && <p className="text-red-500 mb-4">{erro}</p>}

      {/* Imóvel encontrado */}
      {imovel && (
        <section className="bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-2">{imovel.nome}</h2>
          <p className="text-gray-300 text-sm">{imovel.endereco}</p>
          <p className="text-teal-400 font-semibold mt-2 text-lg">
            Valor: R$ {Number(imovel.valor).toFixed(2)}
          </p>
        </section>
      )}

      {/* Link do pagamento atual */}
      {linkPagamento && (
        <section className="bg-gray-900 p-4 rounded-lg shadow text-center mb-6">
          <h3 className="text-lg font-bold mb-2">
            {metodo === 'PIX' ? 'Pagamento via PIX' : 'Boleto Gerado'}
          </h3>
          <a
            href={linkPagamento}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 underline"
          >
            Acessar pagamento
          </a>
        </section>
      )}

      {/* Histórico */}
      <section className="bg-gray-800 p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-3 text-teal-400">
          Histórico de Pagamentos
        </h2>

        {historico.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum pagamento ainda.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="py-2">Data</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((p, i) => (
                <tr key={i} className="border-b border-gray-700">
                  <td className="py-2">{p.data}</td>
                  <td>{p.tipo}</td>
                  <td>R$ {Number(p.valor).toFixed(2)}</td>
                  <td>
                    <a
                      href={p.link}
                      target="_blank"
                      className="text-teal-400 underline"
                    >
                      Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
