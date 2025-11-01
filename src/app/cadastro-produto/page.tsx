'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { FaPlus, FaTimes, FaUserCircle } from 'react-icons/fa';
import Cydebar from '@/app/components/Cydebar';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid

interface Imovel {
  id: string;
  nome: string;
  endereco: string;
  valor: number;
  tipo: string;
  statusAluguel: 'disponivel' | 'alugado';
  fotos?: string[];
  criadoEm: any;
  token?: string;
}

export default function ImoveisPage() {
  const router = useRouter();
  const db = getFirestore();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Usuário');
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalCadastro, setModalCadastro] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState<Imovel | null>(null);

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [tipo, setTipo] = useState('');
  const [statusAluguel, setStatusAluguel] = useState<'disponivel' | 'alugado'>('disponivel');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);

      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.nome || 'Usuário');
      }
    });
    return () => unsubscribe();
  }, [router, db]);

  const carregarImoveis = async (uid: string) => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'imoveis'));
      const lista: Imovel[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === uid) lista.push({ id: doc.id, ...data } as Imovel);
      });
      setImoveis(lista);
    } catch (e) {
      console.error('Erro ao carregar imóveis:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) carregarImoveis(userId);
  }, [userId]);

  const cadastrarImovel = async () => {
    if (!nome || !endereco || !valor || !tipo) {
      setErro('Preencha todos os campos.');
      return;
    }
    try {
      const token = uuidv4(); // gera token único
      await addDoc(collection(db, 'imoveis'), {
        nome,
        endereco,
        valor,
        tipo,
        statusAluguel,
        userId,
        criadoEm: new Date(),
        token,
      });
      setNome('');
      setEndereco('');
      setValor(0);
      setTipo('');
      setStatusAluguel('disponivel');
      setErro('');
      setModalCadastro(false);
      if (userId) carregarImoveis(userId);
    } catch (e) {
      console.error('Erro ao cadastrar imóvel:', e);
      setErro('Erro ao cadastrar. Tente novamente.');
    }
  };

  const deletarImovel = async (id: string) => {
    if (!confirm('Deseja realmente deletar este imóvel?')) return;
    try {
      await deleteDoc(doc(db, 'imoveis', id));
      if (userId) carregarImoveis(userId);
    } catch (e) {
      console.error('Erro ao deletar imóvel:', e);
    }
  };

  if (loading) return <p className="text-gray-100 p-6">Carregando imóveis...</p>;

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <Cydebar userType="locador" />

      <div className="flex-1 p-6 ml-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Meus Imóveis</h1>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <p className="text-base text-gray-300 font-medium">Olá,</p>
              <p className="text-lg text-white font-extrabold -mt-1">{userName}!</p>
            </div>
            <FaUserCircle size={40} className="text-gray-400" />
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg"
            onClick={() => setModalCadastro(true)}
          >
            <FaPlus />
            <span>Adicionar Imóvel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveis.map((imovel) => (
            <div
              key={imovel.id}
              className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:scale-105 transition"
              onClick={() => setModalDetalhes(imovel)}
            >
              <div className="bg-gray-700 h-40 rounded-lg mb-4 flex items-center justify-center text-gray-400">
                {imovel.fotos?.[0] ? (
                  <img
                    src={imovel.fotos[0]}
                    alt={imovel.nome}
                    className="h-40 w-full object-cover rounded-lg"
                  />
                ) : (
                  'Sem foto'
                )}
              </div>
              <h2 className="text-xl font-semibold">{imovel.nome}</h2>
              <p>{imovel.endereco}</p>
              <p className="font-bold mt-2">R$ {imovel.valor.toFixed(2)}</p>
              <span
                className={`mt-2 inline-block px-2 py-1 rounded-full text-sm ${
                  imovel.statusAluguel === 'disponivel' ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                {imovel.statusAluguel}
              </span>
            </div>
          ))}
        </div>

        {modalCadastro && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={() => setModalCadastro(false)}
              >
                <FaTimes />
              </button>
              <h2 className="text-2xl font-bold mb-4">Cadastrar Imóvel</h2>
              {erro && <p className="text-red-500 mb-2">{erro}</p>}
              <input
                className="w-full mb-2 p-2 rounded bg-gray-700"
                placeholder="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                className="w-full mb-2 p-2 rounded bg-gray-700"
                placeholder="Endereço"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
              />
              <input
                className="w-full mb-2 p-2 rounded bg-gray-700"
                placeholder="Valor"
                type="number"
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
              />
              <input
                className="w-full mb-2 p-2 rounded bg-gray-700"
                placeholder="Tipo (casa, apto...)"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              />
              <select
                className="w-full mb-4 p-2 rounded bg-gray-700"
                value={statusAluguel}
                onChange={(e) => setStatusAluguel(e.target.value as any)}
              >
                <option value="disponivel">Disponível</option>
                <option value="alugado">Alugado</option>
              </select>
              <button
                className="w-full py-2 bg-teal-600 hover:bg-teal-500 rounded-lg"
                onClick={cadastrarImovel}
              >
                Cadastrar
              </button>
            </div>
          </div>
        )}

        {modalDetalhes && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={() => setModalDetalhes(null)}
              >
                <FaTimes />
              </button>
              <h2 className="text-2xl font-bold mb-4">{modalDetalhes.nome}</h2>
              <p className="mb-2">{modalDetalhes.endereco}</p>
              <p className="font-bold mb-2">R$ {modalDetalhes.valor.toFixed(2)}</p>
              <p className="mb-2">
                Status:{' '}
                <span
                  className={
                    modalDetalhes.statusAluguel === 'disponivel'
                      ? 'text-green-500'
                      : 'text-red-500'
                  }
                >
                  {modalDetalhes.statusAluguel}
                </span>
              </p>

              {/* Token do imóvel */}
              <div className="mb-4">
                <p className="font-semibold">Token do Imóvel:</p>
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-700 p-2 rounded flex-1 break-all">{modalDetalhes.token}</span>
                  <button
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-500 rounded"
                    onClick={() => {
                      navigator.clipboard.writeText(modalDetalhes.token || '');
                      alert('Token copiado!');
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <button
                className="w-full py-2 bg-red-600 hover:bg-red-500 rounded-lg"
                onClick={() => {
                  deletarImovel(modalDetalhes.id);
                  setModalDetalhes(null);
                }}
              >
                Deletar Imóvel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
