'use client';

import Image from 'next/image'; // Importa Image do Next.js
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaHome,
  FaCreditCard,
  FaWallet,
  FaChartPie,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { name: 'Dashboard', icon: <FaHome />, href: '/dashboard' },
  { name: 'Cards', icon: <FaCreditCard />, href: '/cards' },
  { name: 'Wallet', icon: <FaWallet />, href: '/wallet' },
  { name: 'Stats', icon: <FaChartPie />, href: '/stats' },
];

const bottomItems = [
  { name: 'Settings', icon: <FaCog />, href: '/settings' },
];

export default function IconNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const linkClasses = (href: string) =>
    `flex items-center justify-center p-4 rounded-xl mx-2 transition duration-200 ease-in-out ${
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

  return (
    <aside className="fixed top-0 left-0 h-screen w-20 bg-gray-900 border-r border-gray-800 flex flex-col justify-between items-center py-6 z-50">
      {/* Top Section */}
      <div className="flex flex-col items-center space-y-8">
        {/* Logo */}
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

        {/* Navegação */}
        <nav className="flex flex-col gap-4 w-full">
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
        </nav>
      </div>

      {/* Bottom Section: Settings + Logout */}
      <div className="flex flex-col items-center gap-4 w-full">
        {bottomItems.map(({ name, href, icon }) => (
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

        <button
          onClick={handleLogout}
          className="flex items-center justify-center p-4 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl mx-2 transition duration-200"
          aria-label="Logout"
          title="Logout"
        >
          <FaSignOutAlt size={28} />
        </button>
      </div>
    </aside>
  );
}
