'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export default function CadastroPage() {
  const router = useRouter();
  const db = getFirestore();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'locador' | 'locatario' | ''>('');
  const [erro, setErro] = useState('');

  const cadastrar = async () => {
    setErro('');

    if (!tipoUsuario) {
      setErro('Selecione se você é Locador ou Locatário.');
      return;
    }

    try {
      // Cria o usuário no Firebase Authentication
      const userCred = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCred.user;

      // Grava o documento do usuário no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome,
        email,
        tipo: tipoUsuario,
        criadoEm: new Date(),
      });

      // Redireciona para a tela de login
      router.push('/login');
    } catch (e: any) {
      console.error('Erro no cadastro:', e.code, e.message);
      switch (e.code) {
        case 'auth/email-already-in-use':
          setErro('Este e-mail já está em uso.');
          break;
        case 'auth/invalid-email':
          setErro('E-mail inválido.');
          break;
        case 'auth/weak-password':
          setErro('A senha deve ter pelo menos 6 caracteres.');
          break;
        default:
          setErro('Erro ao cadastrar. Tente novamente.');
      }
    }
  };
                               
  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h1>Cadastro</h1>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}

      <input
        type="text"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />
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

      <div style={{ marginBottom: 16 }}>
        <label>
          <input
            type="radio"
            name="tipoUsuario"
            value="locador"
            checked={tipoUsuario === 'locador'}
            onChange={(e) => setTipoUsuario(e.target.value as 'locador')}
          />{' '}
          Locador
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="tipoUsuario"
            value="locatario"
            checked={tipoUsuario === 'locatario'}
            onChange={(e) => setTipoUsuario(e.target.value as 'locatario')}
          />{' '}
          Locatário
        </label>
      </div>

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