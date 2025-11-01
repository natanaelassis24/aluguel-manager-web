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
    getDocs,
    setDoc,
    query,
    where,
    Timestamp,
} from 'firebase/firestore';
import { FaUserCircle } from 'react-icons/fa';

interface Pagamento {
    id: string;
    nomePagador: string;
    idImovel: string;
    valorPago: number;
    taxaCobrada: number;
    status: 'PAGO' | 'PENDENTE';
    dataPagamento: any;
}

export default function WalletPage() {
    const router = useRouter();
    const db = getFirestore();
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Gestor');
    const [wallet, setWallet] = useState<any>(null);
    const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

    // Formulário de cadastro de conta
    const [banco, setBanco] = useState('');
    const [agencia, setAgencia] = useState('');
    const [conta, setConta] = useState('');
    const [cpf, setCpf] = useState('');
    const [erro, setErro] = useState('');

    async function carregarDados(userId: string) {
        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, 'usuarios', userId));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserName(data.nome || 'Gestor');

                // Carrega wallet do usuário
                const walletDoc = await getDoc(doc(db, 'wallets', userId));
                setWallet(walletDoc.exists() ? walletDoc.data() : null);

                // Carrega pagamentos dos últimos 4 meses do usuário
                const quatroMesesAtras = new Date();
                quatroMesesAtras.setMonth(quatroMesesAtras.getMonth() - 4);
                const quatroMesesTimestamp = Timestamp.fromDate(quatroMesesAtras);

                const pagamentosQuery = query(
                    collection(db, 'pagamentos'),
                    where('idUsuario', '==', userId),
                    where('dataPagamento', '>=', quatroMesesTimestamp)
                );

                const pagamentosSnap = await getDocs(pagamentosQuery);
                const pagamentosUser = pagamentosSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Pagamento[];
                setPagamentos(pagamentosUser);
            }
        } catch (error) {
            console.error('Erro ao carregar dados da wallet:', error);
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

            carregarDados(user.uid);
        });

        return () => unsubscribe();
    }, [router]);

    const salvarConta = async () => {
        setErro('');
        if (!banco || !agencia || !conta || !cpf) {
            setErro('Preencha todos os campos.');
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) return;

            await setDoc(doc(db, 'wallets', user.uid), {
                banco,
                agencia,
                conta,
                cpf,
                criadoEm: new Date(),
            });
            carregarDados(user.uid);
        } catch (error) {
            console.error('Erro ao salvar conta:', error);
            setErro('Erro ao salvar conta. Tente novamente.');
        }
    };

    if (loading) {
        return (
            <div className="text-white bg-gray-900 min-h-screen flex items-center justify-center">
                <p className="text-xl">Carregando Wallet...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pt-4">
                    <h1 className="text-3xl font-bold text-white">Wallet</h1>
                    <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end">
                            <p className="text-base text-gray-200 font-medium">Olá,</p>
                            <p className="text-lg text-white font-extrabold -mt-1">{userName}!</p>
                        </div>
                        <FaUserCircle size={40} className="text-gray-400" />
                    </div>
                </div>

                {/* Cadastro ou Cartão */}
                {!wallet ? (
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 max-w-md mx-auto">
                        <h3 className="text-lg font-semibold text-white mb-4">Cadastrar Conta de Recebimento</h3>
                        {erro && <p className="text-red-500 mb-2">{erro}</p>}
                        <input
                            type="text"
                            placeholder="Banco"
                            className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
                            value={banco}
                            onChange={(e) => setBanco(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Agência"
                            className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
                            value={agencia}
                            onChange={(e) => setAgencia(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Conta"
                            className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
                            value={conta}
                            onChange={(e) => setConta(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="CPF"
                            className="w-full mb-2 p-2 rounded bg-gray-700 text-white"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                        />
                        <button
                            onClick={salvarConta}
                            className="w-full py-2 px-4 rounded-lg bg-teal-600 font-semibold hover:bg-teal-500 transition"
                        >
                            Salvar Conta
                        </button>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-teal-500 to-teal-700 p-6 rounded-xl shadow-lg border border-gray-700 max-w-md mx-auto text-white">
                        <h3 className="text-xl font-bold mb-4">Minha Conta</h3>
                        <p><strong>Banco:</strong> {wallet.banco}</p>
                        <p><strong>Agência:</strong> {wallet.agencia}</p>
                        <p><strong>Conta:</strong> {wallet.conta}</p>
                        <p><strong>CPF:</strong> {wallet.cpf}</p>
                    </div>
                )}

                {/* Histórico de pagamentos */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mt-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Histórico de Pagamentos</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-700">
                                    <th className="py-2 px-4">Nome Pagador</th>
                                    <th className="py-2 px-4">ID Imóvel</th>
                                    <th className="py-2 px-4">Valor Pago</th>
                                    <th className="py-2 px-4">Taxa</th>
                                    <th className="py-2 px-4">Status</th>
                                    <th className="py-2 px-4">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagamentos.map((p) => (
                                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700">
                                        <td className="py-2 px-4">{p.nomePagador}</td>
                                        <td className="py-2 px-4">{p.idImovel}</td>
                                        <td className="py-2 px-4">R$ {p.valorPago.toFixed(2)}</td>
                                        <td className="py-2 px-4">R$ {p.taxaCobrada.toFixed(2)}</td>
                                        <td
                                            className={`py-2 px-4 font-semibold ${
                                                p.status === 'PAGO' ? 'text-teal-400' : 'text-red-500'
                                            }`}
                                        >
                                            {p.status}
                                        </td>
                                        <td className="py-2 px-4">
                                            {p.dataPagamento
                                                ? new Date(p.dataPagamento.seconds * 1000).toLocaleDateString()
                                                : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
