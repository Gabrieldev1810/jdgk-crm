import { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { TopNav } from "./TopNav"
import { User } from "@/types/api"

interface AppLayoutProps {
  children: ReactNode
  userEmail?: string
  userRole?: string
  userPermissions?: string[]
  user?: User
  onLogout: () => void
}

export function AppLayout({ children, userEmail, userRole, userPermissions, user, onLogout }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full bg-background">
        <div className="flex h-screen">
          <AppSidebar userRole={userRole} userEmail={userEmail} userPermissions={userPermissions} user={user} onLogout={onLogout} />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TopNav
              userEmail={userEmail}
              userRole={userRole}
              user={user}
              onLogout={onLogout}
            />

            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}