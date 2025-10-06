import { useState } from "react"
import { 
  Home, 
  Users, 
  Phone, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  Headphones,
  Database,
  Upload,
  BookOpen,
  User,
  LogOut,
  Building,
  Mail,
  Calendar,
  MapPin,
  Clock,
  Bell
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import jdgkLogo from "@/assets/jdgk-logo-new.png"

interface MenuItem {
  title: string
  url: string
  icon: typeof Home
  roles: string[]
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, roles: ["super_admin", "admin", "manager", "agent"] },
  { title: "Accounts", url: "/accounts", icon: Users, roles: ["super_admin", "admin", "manager", "agent"] },
  { title: "Call Center", url: "/calls", icon: Phone, roles: ["super_admin", "admin", "manager", "agent"] },
  { title: "Dispositions", url: "/dispositions", icon: FileText, roles: ["super_admin", "admin", "manager"] },
  { title: "Upload Data", url: "/upload", icon: Upload, roles: ["super_admin", "admin", "manager"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["super_admin", "admin", "manager"] },
  { title: "User Management", url: "/users", icon: Shield, roles: ["super_admin", "admin"] },
  { title: "Role Management", url: "/role-management", icon: Shield, roles: ["super_admin", "admin"] },
  { title: "Audit Logs", url: "/audit-logs", icon: FileText, roles: ["super_admin", "admin"] },
  { title: "System Settings", url: "/settings", icon: Settings, roles: ["super_admin", "admin"] },
]

const integrationItems: MenuItem[] = [
  { title: "3CX Status", url: "/integrations/3cx", icon: Headphones, roles: ["super_admin", "admin", "manager"] },
  { title: "Database", url: "/integrations/database", icon: Database, roles: ["super_admin", "admin"] },
]

interface AppSidebarProps {
  userRole?: string
  userEmail?: string
  onLogout?: () => void
}

export function AppSidebar({ userRole = "agent", userEmail = "agent@bank.com", onLogout }: AppSidebarProps) {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [showProfile, setShowProfile] = useState(false)

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent/50 text-sidebar-foreground font-medium border-l-2 border-sidebar-primary" 
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors duration-150"

  // Convert role to lowercase and handle role matching
  const normalizedRole = userRole.toLowerCase()
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(normalizedRole))
  const filteredIntegrationItems = integrationItems.filter(item => item.roles.includes(normalizedRole))
  const collapsed = state === "collapsed"

  const userInitials = userEmail.split('@')[0].slice(0, 2).toUpperCase()

  const getRoleColor = (role: string) => {
    const normalizedRole = role.toLowerCase()
    switch (normalizedRole) {
      case "super_admin": return "text-purple-600"
      case "admin": return "text-destructive"
      case "manager": return "text-warning"  
      case "agent": return "text-success"
      default: return "text-muted-foreground"
    }
  }

  // Mock user profile data
  const userProfile = {
    name: "John Anderson",
    email: userEmail,
    role: userRole,
    department: "Collections Department",
    position: normalizedRole === "super_admin" ? "Super Administrator" :
              normalizedRole === "admin" ? "System Administrator" : 
              normalizedRole === "manager" ? "Collections Manager" : "Collections Agent",
    employeeId: "EMP-2024-001",
    hireDate: "January 15, 2023",
    location: "New York Office",
    phone: "+1 (555) 123-4567",
    manager: normalizedRole !== "super_admin" && normalizedRole !== "admin" ? "Sarah Johnson" : null,
    team: normalizedRole === "manager" ? "Team Alpha" : normalizedRole === "agent" ? "Team Alpha" : null,
    lastLogin: "Today at 9:30 AM",
    status: "Active"
  }

  return (
    <Sidebar
      className="h-full border-r border-sidebar-border glass"
      collapsible="icon"
    >
      <SidebarContent className="bg-transparent">
        {/* Logo */}
        <div className="p-4 flex justify-center">
          <img 
            src={jdgkLogo} 
            alt="JDGK Business Solutions" 
            className={collapsed ? "h-10 w-auto object-contain" : "h-16 w-auto object-contain"}
          />
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-poppins font-semibold px-4 mb-2">
            {!collapsed && "Main Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => {
                const isItemActive = isActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`${getNavCls({ isActive: isItemActive })} transition-colors duration-150`}
                    >
                      <NavLink to={item.url} end className="flex items-center space-x-3 px-4 py-2.5 rounded-lg">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="font-medium text-sm">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Integration Section */}
        {filteredIntegrationItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60 font-poppins font-semibold px-4 mb-2 mt-6">
              {!collapsed && "Integrations"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredIntegrationItems.map((item) => {
                  const isItemActive = isActive(item.url)
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`${getNavCls({ isActive: isItemActive })} transition-colors duration-150`}
                      >
                        <NavLink to={item.url} end className="flex items-center space-x-3 px-4 py-2.5 rounded-lg">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!collapsed && (
                            <span className="font-medium text-sm">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Additional Menu Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 mt-6">
              {/* Documentation */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  className={`${getNavCls({ isActive: isActive("/documentation") })} transition-colors duration-150`}
                >
                  <NavLink to="/documentation" end className="flex items-center space-x-3 px-4 py-2.5 rounded-lg">
                    <BookOpen className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium text-sm">Documentation</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Profile */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors duration-150"
                  onClick={() => setShowProfile(true)}
                >
                  <div className="flex items-center space-x-3 px-4 py-2.5 rounded-lg w-full">
                    <User className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium text-sm">Profile</span>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Logout */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
                  onClick={onLogout}
                >
                  <div className="flex items-center space-x-3 px-4 py-2.5 rounded-lg w-full">
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-medium text-sm">Logout</span>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="glass-dialog border-glass-border max-w-2xl z-[60] bg-background/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center">
              <User className="w-5 h-5 mr-2 text-accent" />
              User Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View and manage your profile information and company details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Header */}
            <div className="flex items-center space-x-4 p-4 glass-light rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={userProfile.name} />
                <AvatarFallback className="bg-gradient-accent text-accent-foreground font-bold text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{userProfile.name}</h3>
                <p className="text-muted-foreground">{userProfile.position}</p>
                <Badge className={`mt-2 ${getRoleColor(userRole)} border-current`} variant="outline">
                  <Shield className="w-3 h-3 mr-1" />
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="border-success text-success mb-2">
                  {userProfile.status}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Last login: {userProfile.lastLogin}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="glass-light">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <User className="w-4 h-4 mr-2 text-accent" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Email:</span>
                    <span className="text-sm text-muted-foreground">{userProfile.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Phone:</span>
                    <span className="text-sm text-muted-foreground">{userProfile.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Location:</span>
                    <span className="text-sm text-muted-foreground">{userProfile.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Hire Date:</span>
                    <span className="text-sm text-muted-foreground">{userProfile.hireDate}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="glass-light">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Building className="w-4 h-4 mr-2 text-accent" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Employee ID:</span>
                    <span className="text-sm text-muted-foreground font-mono">{userProfile.employeeId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Department:</span>
                    <span className="text-sm text-muted-foreground">{userProfile.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Position:</span>
                    <span className="text-sm text-muted-foreground">{userProfile.position}</span>
                  </div>
                  {userProfile.manager && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Manager:</span>
                      <span className="text-sm text-muted-foreground">{userProfile.manager}</span>
                    </div>
                  )}
                  {userProfile.team && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Team:</span>
                      <span className="text-sm text-muted-foreground">{userProfile.team}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="glass-light border-accent/20">
              <CardHeader>
                <CardTitle className="text-base text-accent">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="glass-light border-glass-border">
                    <Settings className="w-3 h-3 mr-1" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="glass-light border-glass-border">
                    <Shield className="w-3 h-3 mr-1" />
                    Change Password
                  </Button>
                  <Button variant="outline" size="sm" className="glass-light border-glass-border">
                    <Bell className="w-3 h-3 mr-1" />
                    Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setShowProfile(false)}
              className="glass-light border-glass-border"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}