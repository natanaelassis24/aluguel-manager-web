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
import { CreditCard, QrCode } from 'lucide-react';

export default function PagamentosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [imovel, setImovel] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [linkPagamento, setLinkPagamento] = useState<string | null>(null);
  const [metodo, setMetodo] = useState<'PIX' | 'BOLETO' | null>(null);
  const [historico, setHistorico] = useState<any[]>([]);

  const db = getFirestore();

  // 🔹 Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 🔹 Buscar imóvel
  const buscarImovel = async (tokenBusca?: string) => {
    const tokenFinal = tokenBusca || token;
    if (!tokenFinal.trim()) {
      setErro('Token inválido.');
      return;
    }

    setErro('');
    const q = query(collection(db, 'imoveis'), where('token', '==', tokenFinal));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      setErro('Imóvel não encontrado.');
      setImovel(null);
      return;
    }

    const dados = snapshot.docs[0].data();
    setImovel(dados);
  };

  // 🔹 Carregar token do localStorage e buscar imóvel automaticamente
  useEffect(() => {
    const tokenSalvo = localStorage.getItem('tokenImovel');
    if (tokenSalvo) {
      setToken(tokenSalvo);
      buscarImovel(tokenSalvo);
    }
  }, []);

  // 🔹 Geração de pagamento
  const gerarPagamento = async (tipo: 'PIX' | 'BOLETO') => {
    if (!imovel || !user) return;

    try {
      setMetodo(tipo);
      setErro('');
      setLinkPagamento(null);

      const response = await fetch('/api/cobranca/gerar', {
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

      const data = await response.json();

      if (response.ok && data?.url) {
        setLinkPagamento(data.url);
        setHistorico((prev) => [
          ...prev,
          {
            tipo,
            valor: imovel.valor,
            data: new Date().toLocaleDateString('pt-BR'),
            link: data.url,
          },
        ]);
      } else {
        setErro(data?.message || 'Erro ao gerar pagamento.');
      }
    } catch (e) {
      console.error(e);
      setErro('Erro ao gerar pagamento.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-gray-900">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-teal-400">Pagamentos</h1>

      {/* Campo de Token */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Digite o token do imóvel"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1 p-3 rounded bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={() => buscarImovel()}
          className="px-5 py-3 bg-teal-600 hover:bg-teal-500 rounded font-semibold"
        >
          Buscar
        </button>
      </div>
      {erro && <p className="text-red-500 mb-4">{erro}</p>}

      {/* Imóvel encontrado */}
      {imovel && (
        <div className="bg-gray-800 p-6 rounded-lg mb-6 shadow">
          <h2 className="text-xl font-bold mb-2">{imovel.nome}</h2>
          <p className="text-gray-400">{imovel.endereco}</p>
          <p className="text-teal-400 font-semibold mt-2 text-lg">
            Valor: R$ {Number(imovel.valor).toFixed(2)}
          </p>

          {/* Botões de Pagamento */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => gerarPagamento('PIX')}
              className="flex items-center justify-center gap-2 w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-lg text-lg font-semibold transition"
            >
              <QrCode className="w-6 h-6" />
              Gerar PIX
            </button>
            <button
              onClick={() => gerarPagamento('BOLETO')}
              className="flex items-center justify-center gap-2 w-full py-4 bg-teal-600 hover:bg-teal-500 rounded-lg text-lg font-semibold transition"
            >
              <CreditCard className="w-6 h-6" />
              Gerar Boleto
            </button>
          </div>
        </div>
      )}

      {/* Link do pagamento gerado */}
      {linkPagamento && (
        <div className="bg-gray-800 p-4 rounded-lg shadow text-center mb-8">
          <h3 className="text-lg font-bold mb-2 text-teal-400">
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
        </div>
      )}

      {/* Histórico de pagamentos */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-teal-400">
          Histórico de Pagamentos
        </h2>
        {historico.length === 0 ? (
          <p className="text-gray-400">Nenhum pagamento registrado ainda.</p>
        ) : (
          historico.map((p, i) => (
            <div
              key={i}
              className="bg-gray-800 p-4 rounded mb-3 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-200">
                  {p.tipo === 'PIX' ? 'Pagamento via PIX' : 'Boleto'}
                </p>
                <p className="text-sm text-gray-400">Data: {p.data}</p>
              </div>
              <div className="text-right">
                <p className="text-teal-400 font-bold">
                  R$ {p.valor.toFixed(2)}
                </p>
                <a
                  href={p.link}
                  target="_blank"
                  className="text-sm text-teal-400 underline"
                >
                  Ver pagamento
                </a>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
