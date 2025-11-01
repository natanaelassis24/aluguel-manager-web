// src/app/api/cobranca/gerar/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'; 
// ⚠️ CORREÇÃO: Importa 'firestore' e renomeia para 'db' para usarmos o nome 'db'
import { firestore as db } from '@/lib/firebase'; 

// Variáveis de ambiente seguras (SERVER-SIDE ONLY)
const ASAAS_URL = process.env.ASAAS_URL;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
// ESTA VARIÁVEL PRECISA SER CONFIGURADA NO .env.local e Vercel!
const YGGDRASIL_WALLET_ID = process.env.ASAAS_PLATFORM_WALLET_ID; 

interface CobrancaPayload {
    aluguelId: string;
    locatarioId: string;
    locadorWalletId: string; // ID da carteira do Locador (LIDO DO FIREBASE ANTES DE CHAMAR ESTA API)
    valor: number;
    vencimento: string; // Data no formato YYYY-MM-DD
    asaasCustomerId: string; // ID do Cliente (Locatário) no Asaas
}

export async function POST(request: NextRequest) {
    // Validação de segurança básica da infraestrutura
    if (!ASAAS_URL || !ASAAS_API_KEY || !YGGDRASIL_WALLET_ID) {
        return NextResponse.json({ message: 'Erro de configuração da API Keys ou Wallet ID. Verifique o ASAAS_PLATFORM_WALLET_ID.' }, { status: 500 });
    }

    // A. Receber e tipar o corpo da requisição
    const payload: CobrancaPayload = await request.json();
    const { aluguelId, locadorWalletId, valor, vencimento, locatarioId, asaasCustomerId } = payload;

    // Validação de dados cruciais
    if (!locadorWalletId || !valor || !vencimento || !aluguelId || !asaasCustomerId) {
        return NextResponse.json({ message: 'Dados de cobrança incompletos.' }, { status: 400 });
    }

    let cobrancaRef: any; // Para garantir que podemos deletar no bloco catch
    
    try {
        // 1. Criar o Documento PENDENTE no Firebase e obter o ID
        cobrancaRef = await addDoc(collection(db, 'cobrancas'), {
            aluguelId,
            locatarioId,
            locadorWalletId,
            valor,
            vencimento,
            status: 'PENDENTE', // Estado inicial
            criadoEm: new Date(),
        });
        
        const cobrancaId = cobrancaRef.id;

        // 2. Lógica do Split de Pagamento (5% para Yggdrasil, o restante para o Locador)
        const taxaYggdrasil = 0.05; // 5% de taxa da Yggdrasil
        const valorLocador = valor * (1 - taxaYggdrasil); 
        const valorYggdrasil = valor * taxaYggdrasil; 
        
        const asaasBody = {
            customer: asaasCustomerId, // Cliente que irá pagar (Locatário)
            billingType: 'PIX', // Método de pagamento
            value: valor,
            dueDate: vencimento,
            // CRÍTICO: USA O ID DO FIREBASE COMO CHAVE DE CONCILIAÇÃO para o Webhook
            externalReference: cobrancaId, 
            description: `Aluguel Ref: ${aluguelId}`,

            // 3. CONFIGURAÇÃO DO SPLIT
            split: [
                {
                    // Locador (recebe a maior parte)
                    walletId: locadorWalletId, 
                    value: valorLocador.toFixed(2), // Garante formato monetário
                },
                {
                    // Yggdrasil (recebe a taxa)
                    walletId: YGGDRASIL_WALLET_ID, 
                    value: valorYggdrasil.toFixed(2), 
                }
            ],
        };

        // 4. Chamada à API do Asaas
        const responseAsaas = await fetch(`${ASAAS_URL}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access_token': ASAAS_API_KEY,
            },
            body: JSON.stringify(asaasBody),
        });

        const dadosAsaas = await responseAsaas.json();

        if (dadosAsaas.errors || !dadosAsaas.id) {
            console.error('Erro Asaas na Geração de Cobrança:', dadosAsaas.errors);
            // ⚠️ FALHA: Deletamos o documento PENDENTE se o Asaas falhar
            await deleteDoc(cobrancaRef); 
            return NextResponse.json({ message: 'Falha ao gerar cobrança no PSP.', errors: dadosAsaas.errors }, { status: 500 });
        }

        // 5. Salvar dados de retorno do Asaas no Firebase
        await updateDoc(cobrancaRef, {
            asaasPaymentId: dadosAsaas.id, 
            linkPagamento: dadosAsaas.invoiceUrl, // Link para Boleto/Comprovante
            pixPayload: dadosAsaas.pix?.payload || null, // Código PIX Copia e Cola
        });

        // 6. Retornar SUCESSO para o Frontend do Locatário
        return NextResponse.json({ 
            success: true, 
            cobrancaId: cobrancaId,
            linkPagamento: dadosAsaas.invoiceUrl,
            pixPayload: dadosAsaas.pix?.payload || null,
        }, { status: 200 });

    } catch (error) {
        console.error('ERRO NA GERAÇÃO DA COBRANÇA:', error);
        // Tenta deletar o documento PENDENTE se a falha for interna
        if (cobrancaRef) {
            await deleteDoc(cobrancaRef).catch(e => console.error("Erro ao deletar doc:", e));
        }
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    }
}
