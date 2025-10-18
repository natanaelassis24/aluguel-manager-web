'use client';

import { useEffect, useState } from 'react';
import { firestore } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Produto {
  id: string;
  descricao: string;
  valor: number;
  fotoURL?: string;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProdutos() {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(firestore, 'produtos'));
        const lista: Produto[] = [];
        querySnapshot.forEach((doc) => {
          lista.push({ id: doc.id, ...doc.data() } as Produto);
        });
        setProdutos(lista);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProdutos();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Produtos Cadastrados</h1>

      {loading && <p style={{ textAlign: 'center' }}>Carregando produtos...</p>}

      {!loading && produtos.length === 0 && (
        <p style={{ textAlign: 'center' }}>Nenhum produto cadastrado ainda.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {produtos.map((produto) => (
          <li
            key={produto.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid #ddd',
            }}
          >
            {produto.fotoURL && (
              <img
                src={produto.fotoURL}
                alt={produto.descricao}
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: '1rem' }}
              />
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{produto.descricao}</h2>
              <p style={{ margin: '0.2rem 0', color: '#555' }}>
                Valor: <strong>R$ {produto.valor.toFixed(2)}</strong>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
