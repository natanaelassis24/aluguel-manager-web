import Cydebar from './components/Cydebar'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex bg-gray-50 min-h-screen">
        <Cydebar />

        <main className="flex-1 p-6 overflow-auto" style={{ marginLeft: '16rem' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
