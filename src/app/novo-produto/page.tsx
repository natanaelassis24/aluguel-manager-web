'use client';

import { useState } from 'react';
import { firestore, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function NovoProdutoPage() {
  const [foto, setFoto] = useState<File | null>(null);
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [pagamento, setPagamento] = useState<string[]>([]);
  const [vencimento, setVencimento] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const formasPagamento = ['Boleto', 'Pix', 'Cartão de Crédito', 'Cartão de Débito'];

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFoto(e.target.files[0]);
    }
  }

  function togglePagamento(forma: string) {
    setPagamento((prev) =>
      prev.includes(forma) ? prev.filter((f) => f !== forma) : [...prev, forma]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!foto) {
      setErro('Por favor, selecione uma foto.');
      return;
    }

    try {
      const storageRef = ref(storage, `produtos/${foto.name}-${Date.now()}`);
      await uploadBytes(storageRef, foto);
      const fotoURL = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, 'produtos'), {
        descricao,
        valor: parseFloat(valor),
        formasPagamento: pagamento,
        dataVencimento: Timestamp.fromDate(new Date(vencimento)),
        fotoURL,
        criadoEm: Timestamp.now(),
      });

      setSucesso('Produto cadastrado com sucesso!');
      setDescricao('');
      setValor('');
      setPagamento([]);
      setVencimento('');
      setFoto(null);
      (document.getElementById('inputFoto') as HTMLInputElement).value = '';
    } catch (error) {
      setErro('Erro ao cadastrar produto. Tente novamente.');
      console.error(error);
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>Cadastrar Novo Produto</h1>

      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      {sucesso && <p style={{ color: 'green' }}>{sucesso}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Foto:
          <input id="inputFoto" type="file" accept="image/*" onChange={handleFotoChange} />
        </label>

        <label>
          Descrição:
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            rows={3}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Valor do Aluguel:
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            min="0"
            step="0.01"
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <fieldset style={{ marginBottom: 10 }}>
          <legend>Formas de Pagamento:</legend>
          {formasPagamento.map((forma) => (
            <label key={forma} style={{ display: 'block' }}>
              <input
                type="checkbox"
                checked={pagamento.includes(forma)}
                onChange={() => togglePagamento(forma)}
              />
              {forma}
            </label>
          ))}
        </fieldset>

        <label>
          Data de Vencimento:
          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <button type="submit" style={{ padding: '10px 20px' }}>
          Cadastrar Produto
        </button>
      </form>
    </main>
  );
}
