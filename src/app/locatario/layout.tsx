// Este layout é SERVER COMPONENT (sem "use client")
export const metadata = {
  title: 'Alugues Geral – Painel do Locatário',
  description:
    'Gerencie seus aluguéis com facilidade no painel do locatário do Alugues Geral. Visualize pagamentos, vencimentos e imóveis vinculados em tempo real.',
  keywords: ['aluguel', 'locatário', 'gestão de imóveis', 'painel de aluguéis'],
  openGraph: {
    title: 'Alugues Geral – Painel do Locatário',
    description:
      'Painel do locatário no Alugues Geral: controle de aluguéis, vencimentos e imóveis vinculados em tempo real.',
    url: 'https://aluguesgeral.com/locatario',
    siteName: 'Alugues Geral',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function LocatarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
