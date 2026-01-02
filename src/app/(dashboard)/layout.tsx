import { JarProvider } from '@/contexts/jar-context'
import { Sidebar } from '@/components/shell/sidebar'
import { VersionBadge } from '@/components/shell/version-badge'

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
        <VersionBadge />
      </div>
    </JarProvider>
  )
}
