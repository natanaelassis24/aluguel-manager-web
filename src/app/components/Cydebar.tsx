'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaBoxOpen, FaPlus, FaUserCircle, FaBars } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';

type Props = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const Cydebar = ({ isOpen, setIsOpen }: Props) => {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  const menuItems = [
    { name: 'Dashboard', icon: <FaHome />, href: '/dashboard' },
    { name: 'Produtos', icon: <FaBoxOpen />, href: '/produtos' },
    ...(userEmail
      ? [{ name: 'Cadastrar Produto', icon: <FaPlus />, href: '/produtos/cadastrar' }]
      : [{ name: 'Cadastrar', icon: <FaPlus />, href: '/cadastro' }]),
  ];

  // Função que retorna as classes para o link, igual pro Dashboard e todos os outros
  const linkClasses = (href: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-md transition ${
      pathname === href
        ? 'bg-blue-100 text-blue-600 font-semibold'
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white shadow-lg flex flex-col justify-between z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div>
        {/* Botão dentro da Sidebar com as mesmas classes e estilo do menu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-4 py-2 w-full text-left rounded-md transition ${
            isOpen ? 'justify-start' : 'justify-center'
          } text-gray-700 hover:bg-gray-100`}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          type="button"
        >
          <FaBars className="text-blue-600" size={20} />
          {isOpen && (
            <span className="text-2xl font-bold text-blue-600 select-none">
              AluguelApp
            </span>
          )}
        </button>

        <nav className="flex flex-col gap-2 px-2 mt-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${linkClasses(item.href)} ${isOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              {isOpen && item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center gap-3 text-gray-700">
        <FaUserCircle size={28} />
        {isOpen && (
          <div className="flex flex-col">
            <span className="font-semibold">{userEmail ?? 'Usuário'}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline pt-1"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Cydebar;
