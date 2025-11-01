import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore'; // Importa funções do Firestore
// ⚠️ CORREÇÃO: Importa 'firestore' e renomeia para 'db' para usarmos o nome 'db' no código
import { firestore as db } from '@/lib/firebase'; 

// Variáveis de ambiente SEGURAS (sem NEXT_PUBLIC)
const ASAAS_URL = process.env.ASAAS_URL;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

// Definição da função POST tipada
export async function POST(request: NextRequest) {
    // Adiciona verificação de chaves de API
    if (!ASAAS_URL || !ASAAS_API_KEY) {
        return NextResponse.json({ message: 'Erro de configuração da API Key do Asaas.' }, { status: 500 });
    }

    try {
        // Tipagem dos dados de entrada esperados do seu frontend
        const { locadorId, nomeCompleto, email, cpfCnpj, telefone, dadosBancarios } = (await request.json()) as {
            locadorId: string;
            nomeCompleto: string;
            email: string;
            cpfCnpj: string;
            telefone: string;
            dadosBancarios: {
                bankCode: string;
                agency: string;
                account: string;
                accountDigit: string;
            };
        };

        if (!locadorId || !nomeCompleto || !dadosBancarios) {
            return NextResponse.json({ message: 'Dados do Locador incompletos.' }, { status: 400 });
        }

        // 1. Criar a Conta de Recebimento no Asaas
        const asaasAccountBody = {
            name: nomeCompleto,
            email: email,
            cpfCnpj: cpfCnpj,
            mobilePhone: telefone,
            receiveSplit: true, // HABILITA PARA RECEBER SPLIT DE PAGAMENTO
            // Detalhes bancários 
            bank: dadosBancarios.bankCode,
            agency: dadosBancarios.agency,
            account: dadosBancarios.account,
            accountDigit: dadosBancarios.accountDigit,
        };

        const responseAsaas = await fetch(`${ASAAS_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY,
            },
            body: JSON.stringify(asaasAccountBody),
        });

        // Tipagem da resposta (Apenas se a resposta for OK)
        const dadosAsaas: { errors?: any[]; walletId?: string; id?: string } = await responseAsaas.json();

        if (dadosAsaas.errors || !dadosAsaas.walletId) {
            console.error('Erro Asaas Subconta:', dadosAsaas.errors);
            return NextResponse.json({ message: 'Falha na integração com o Asaas.', errors: dadosAsaas.errors }, { status: 500 });
        }

        // 2. Salvar o ID da Carteira (Wallet) no Firestore
        const locadorRef = doc(db, 'usuarios', locadorId);

        await updateDoc(locadorRef, {
            // ESTE CAMPO É CRÍTICO para a Geração de Cobrança com Split
            asaasWalletId: dadosAsaas.walletId,
            integracaoAsaasStatus: 'ATIVA',
            asaasAccountId: dadosAsaas.id,
        });

        return NextResponse.json({
            success: true,
            message: 'Locador integrado com sucesso para Split.',
            asaasWalletId: dadosAsaas.walletId,
        }, { status: 200 });

    } catch (error) {
        console.error('ERRO NA INTEGRAÇÃO DO LOCADOR:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}
