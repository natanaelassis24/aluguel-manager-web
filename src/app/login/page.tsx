'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const db = getFirestore();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const login = async () => {
    try {
      // Faz login no Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCred.user;

      // Busca o tipo do usuário no Firestore
      const userRef = doc(db, 'usuarios', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const dados = userSnap.data();
        const tipo = dados.tipo;

        // Redireciona conforme o tipo
        if (tipo === 'locador' || tipo === 'locado') {
          router.push('/dashboard'); // vai para a tela principal do locador
        } else if (tipo === 'locatario') {
          router.push('/locatario'); // vai para a tela do locatário
        } else {
          setErro('Tipo de usuário inválido.');
        }
      } else {
        setErro('Usuário não encontrado no banco de dados.');
      }
    } catch (e: any) {
      console.error('Erro no login:', e);
      setErro('E-mail ou senha incorretos.');
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
