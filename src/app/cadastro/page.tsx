'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const cadastrar = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      router.push('/login');
    } catch (e: any) {
      console.error('Erro no cadastro:', e);
      setErro(e.message || 'Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h1>Cadastro</h1>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />
      <button onClick={cadastrar} style={{ width: '100%', padding: 10 }}>
        Cadastrar
      </button>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <p>
          Já tem uma conta?{' '}
          <Link href="/login" style={{ color: 'blue', textDecoration: 'underline' }}>
            Faça login aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
