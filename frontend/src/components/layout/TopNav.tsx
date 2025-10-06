import { useState } from "react"
import { 
  Search, 
  Bell, 
  User, 
  Moon, 
  Sun, 
  LogOut, 
  Settings,
  Shield,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/components/ui/theme-provider"

interface TopNavProps {
  userEmail?: string
  userRole?: string
  onLogout: () => void
}

export function TopNav({ userEmail = "agent@bank.com", userRole = "agent", onLogout }: TopNavProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { theme, setTheme } = useTheme()

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default"
      case "manager": return "secondary"
      case "agent": return "outline"
      default: return "outline"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-destructive"
      case "manager": return "text-warning"  
      case "agent": return "text-success"
      default: return "text-muted-foreground"
    }
  }

  const userInitials = userEmail.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <header className="glass-card border-b border-glass-border h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      {/* Left Section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <SidebarTrigger className="hover:bg-glass-light p-2 rounded-lg transition-colors" />
        
        {/* Global Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search accounts, calls, or agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-light border-glass-border pl-10 pr-4 w-60 lg:w-80 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Search Button */}
        <Button
          variant="ghost"
          size="sm"
          className="sm:hidden hover:bg-glass-light"
        >
          <Search className="w-5 h-5" />
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-glass-light"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Theme Toggle - hidden on small screens */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="hover:bg-glass-light hidden sm:flex"
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-auto px-2 sm:px-3 hover:bg-glass-light">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={userEmail} />
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{userEmail}</span>
                  <Badge variant={getRoleBadgeVariant(userRole)} className="text-xs h-4">
                    <Shield className="w-3 h-3 mr-1" />
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-card border-glass-border w-56 bg-background/95 backdrop-blur-sm z-50" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userEmail}</p>
                <p className={`text-xs leading-none ${getRoleColor(userRole)}`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Access
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-glass-border" />
            <DropdownMenuItem className="hover:bg-glass-light cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-glass-light cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            {/* Theme toggle for mobile */}
            <DropdownMenuItem 
              className="hover:bg-glass-light cursor-pointer sm:hidden"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-glass-border" />
            <DropdownMenuItem 
              className="hover:bg-destructive/10 text-destructive cursor-pointer"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}