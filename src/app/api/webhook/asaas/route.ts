// src/app/api/webhook/asaas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'; 
// ⚠️ CORREÇÃO: Importa 'firestore' e renomeia para 'db' para usarmos o nome 'db'
import { firestore as db } from '@/lib/firebase'; 

// Definição de tipos para o evento de Webhook do Asaas
interface AsaasPayment {
    id: string; // ID do pagamento no Asaas
    value: number;
    externalReference: string; // CRÍTICO: ID da sua cobrança no Firebase
    status: string; // Ex: RECEIVED, CONFIRMED
    // ... outros campos que o Asaas envia
}

interface AsaasWebhookEvent {
    event: string; // Ex: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_OVERDUE
    payment: AsaasPayment;
    // ...
}

export async function POST(request: NextRequest) {
    // 1. Recebe a notificação do Asaas e tipa o corpo
    const body: AsaasWebhookEvent = await request.json();
    const evento = body.event;
    const pagamento = body.payment; 
    
    // ⚠️ SEGURANÇA: Idealmente, você deve validar a assinatura do webhook aqui.
    // Ex: const signature = request.headers.get('asaas-webhook-signature');

    // 2. Extrai a Chave de Conciliação (ID do Firestore)
    const suaCobrancaId = pagamento?.externalReference; 
    
    if (!suaCobrancaId) {
        // Retorna 400 se não conseguir identificar qual documento atualizar
        return NextResponse.json({ message: 'Missing external reference (ID da Cobrança Firebase)' }, { status: 400 });
    }

    try {
        // 3. Processa Apenas Eventos de Pagamento Bem-Sucedido (Conciliação)
        if (evento === 'PAYMENT_RECEIVED' || evento === 'PAYMENT_CONFIRMED') {
            
            const cobrancaRef = doc(db, 'cobrancas', suaCobrancaId);
            
            // 4. ATUALIZA O STATUS DA COBRANÇA NO FIRESTORE
            await updateDoc(cobrancaRef, {
                status: 'PAGO', 
                dataConciliacao: serverTimestamp(), // Usa o timestamp do servidor do Firebase
                valorPago: pagamento.value, 
                asaasPaymentId: pagamento.id,
                // Opcional: registrar detalhes do Split, se necessário
            });
            
            console.log(`[ASAAS Webhook] Cobrança ${suaCobrancaId} marcada como PAGA. Valor: ${pagamento.value}`);
            
            // 5. Retorno 200 OK: CRÍTICO! Avisa o Asaas que você recebeu e processou o evento.
            return NextResponse.json({ message: 'Conciliação processada com sucesso' }, { status: 200 });
        }
        
        // Se for outro evento (ex: OVERDUE, DELETED), apenas confirmamos o recebimento para o Asaas
        return NextResponse.json({ message: `Event ${evento} received, no action taken` }, { status: 200 });

    } catch (error) {
        console.error('ERRO NO WEBHOOK (FIREBASE UPDATE):', error);
        // Retorno 500: Indica ao Asaas para tentar reenviar o evento mais tarde.
        return NextResponse.json({ message: 'Internal Server Error during update' }, { status: 500 });
    }
}
