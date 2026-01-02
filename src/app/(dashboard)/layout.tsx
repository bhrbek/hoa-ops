import { JarProvider } from '@/contexts/jar-context'
import { Sidebar } from '@/components/shell/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <JarProvider>
      <div className="flex h-screen bg-background dark">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </JarProvider>
  )
}
