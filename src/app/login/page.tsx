'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push('/dashboard');
    } catch (e: any) {
      setErro('Email ou senha incorretos');
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      {erro && <p className="text-red-500">{erro}</p>}
      <input
        className="border p-2 w-full mb-4"
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-4"
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />
      <button
        onClick={login}
        className="bg-blue-500 text-white p-2 w-full"
      >
        Entrar
      </button>

      <div className="mt-4 text-center">
        <p>
          Não tem uma conta?{' '}
          <Link href="/cadastro" className="text-blue-500 underline">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
