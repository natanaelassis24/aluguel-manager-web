'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Firebase
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
// Firestore
import { getFirestore, doc, getDoc } from 'firebase/firestore';
// Gráfico e ícones
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
import Link from 'next/link';

// Tipagem do aluguel
interface Aluguel {
    id: string;
    valor: number;
    pago: boolean;
    dataVencimento: any;
}

// Funções utilitárias
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
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [alugueis, setAlugueis] = useState<Aluguel[]>([]);
    const [userName, setUserName] = useState<string>('Gestor');

    async function carregarDados(userId: string) {
        setLoading(true);
        const db = getFirestore();

        try {
            // Buscar o nome do usuário no Firestore
            const userDoc = await getDoc(doc(db, 'usuarios', userId));

            if (userDoc.exists()) {
                const dados = userDoc.data();
                setUserName(dados.nome || 'Gestor'); // Nome salvo ou fallback
            } else {
                setUserName('Gestor');
            }

            // Aqui você pode buscar os aluguéis do usuário no futuro
            setAlugueis([]);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            setUserName('Gestor');
            setAlugueis([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login'); // Redireciona para login se não estiver logado
                return;
            }

            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'usuarios', user.uid));

            if (!userDoc.exists()) {
                router.push('/login'); // Usuário não existe no Firestore
                return;
            }

            const tipo = userDoc.data().tipo;

            if (tipo !== 'locador') {
                router.push('/locatario'); // Redireciona locatários para a página correta
                return;
            }

            // Se for locador, carrega os dados do dashboard
            carregarDados(user.uid);
        });

        return () => unsubscribe();
    }, [router]);

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
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 pt-4">
                    <h1 className="text-3xl font-bold text-white">Dashboard de Aluguéis</h1>

                    <div className="flex items-center space-x-6">
                        {/* Search */}
                        <div className="relative hidden sm:block">
                            <input
                                type="text"
                                placeholder="Buscar Contrato/Locatário"
                                className="bg-gray-800 text-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-teal-500 focus:border-teal-500 border border-gray-700 w-64"
                            />
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Olá gestor e ícone */}
                        <div className="flex items-center space-x-3">
                            <div className="flex flex-col items-end">
                                <p className="text-base text-gray-200 font-medium">Olá,</p>
                                <p className="text-lg text-white font-extrabold -mt-1">{userName}!</p>
                            </div>
                            <FaUserCircle size={40} className="text-gray-400" />
                        </div>

                        {/* Botão de saída removido */}
                    </div>
                </div>

                {/* Conteúdo da dashboard - grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Filtros */}
                        <div className="flex space-x-4 mb-4">
                            <button className="px-6 py-2 rounded-lg text-white bg-teal-600 font-medium hover:bg-teal-500">
                                Todos
                            </button>
                            <button className="px-6 py-2 rounded-lg text-gray-400 border border-gray-700 hover:bg-gray-700 font-medium">
                                Pagos
                            </button>
                            <button className="px-6 py-2 rounded-lg text-gray-400 border border-gray-700 hover:bg-gray-700 font-medium">
                                Pendentes
                            </button>
                            <button className="px-6 py-2 rounded-lg text-gray-400 border border-gray-700 hover:bg-gray-700 font-medium">
                                Vencidos
                            </button>
                        </div>

                        {/* Gráfico */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">Fluxo de Aluguéis</h2>
                                <span className="text-sm text-teal-400 hover:underline cursor-pointer">Ver Todos</span>
                            </div>

                            <div style={{ height: '280px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dadosGrafico} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
                                        <XAxis dataKey="mes" stroke="#9ca3af" axisLine={false} tickLine={false} />
                                        <YAxis
                                            tickFormatter={(value) => (value === 0 ? '0k$' : `${(value / 1000).toFixed(1)}k$`)}
                                            stroke="#9ca3af"
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                            formatter={(value: number) => [formatarMoeda(value), 'Recebido']}
                                        />
                                        <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={30} fill="#14b8a6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

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

                        {/* Projeção mensal */}
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

                        {/* Botão Novo Contrato */}
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
        </div>
    );
}
