'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaHome,
  FaCreditCard,
  FaWallet,
  FaCog,
  FaSignOutAlt,
  FaBuilding,
} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type UserType = 'locador' | 'locatario';

type IconNavbarProps = {
  userType: UserType;
};

export default function IconNavbar({ userType }: IconNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const linkClasses = (href: string) =>
    `flex items-center justify-center p-4 rounded-xl transition duration-200 ease-in-out ${
      pathname === href
        ? 'bg-teal-700/50 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Não foi possível deslogar. Tente novamente.');
    }
  };

  // 🔹 Locador continua igual
  const navItemsLocador = [
    { name: 'Dashboard', icon: <FaHome />, href: '/dashboard' },
    { name: 'Wallet', icon: <FaWallet />, href: '/wallet' },
    { name: 'Imóveis', icon: <FaBuilding />, href: '/cadastro-produto' },
  ];

  // 🔹 Locatário: substituímos “Cards” por “Pagamentos”
  const navItemsLocatario = [
    { name: 'Home', icon: <FaHome />, href: '/locatario' },
    { name: 'Pagamentos', icon: <FaCreditCard />, href: '/pagamentos' }, // 👈 aqui foi trocado o caminho
  ];

  const navItems = userType === 'locador' ? navItemsLocador : navItemsLocatario;

  return (
    <aside
      className="
        fixed bg-gray-900 border-gray-800 flex justify-between items-center z-50
        md:flex-col md:justify-between md:py-6 md:w-20 md:h-screen md:left-0 md:top-0 md:border-r
        w-full h-16 bottom-0 left-0 border-t
      "
    >
      {/* Top Section Desktop */}
      <div className="hidden md:flex flex-col items-center w-full">
        <div className="w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Logo"
            width={60}
            height={60}
            className="object-contain"
            priority
          />
        </div>

        <nav className="flex flex-col gap-2 mt-4 w-full items-center">
          {navItems.map(({ name, href, icon }) => (
            <Link
              key={name}
              href={href}
              className={`${linkClasses(href)} md:mx-2`}
              aria-label={name}
              title={name}
            >
              <span className="text-xl">{icon}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom Section Desktop */}
      <div className="hidden md:flex flex-col items-center gap-4 w-full pb-4">
        <Link
          href="/settings"
          className={linkClasses('/settings')}
          aria-label="Configurações"
          title="Configurações"
        >
          <FaCog size={24} />
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-4 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl mx-2 transition duration-200"
          aria-label="Logout"
          title="Logout"
        >
          <FaSignOutAlt size={28} />
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav className="flex md:hidden w-full justify-around items-center">
        {navItems.map(({ name, href, icon }) => (
          <Link
            key={name}
            href={href}
            className={linkClasses(href)}
            aria-label={name}
            title={name}
          >
            <span className="text-xl">{icon}</span>
          </Link>
        ))}

        <Link
          href="/settings"
          className="flex items-center justify-center p-4 text-gray-400 hover:text-white"
          aria-label="Configurações"
          title="Configurações"
        >
          <FaCog size={22} />
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-4 text-gray-400 hover:text-white"
          aria-label="Logout"
          title="Logout"
        >
          <FaSignOutAlt size={22} />
        </button>
      </nav>
    </aside>
  );
}
