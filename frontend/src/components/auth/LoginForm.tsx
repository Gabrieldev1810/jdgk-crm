import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Shield, Phone, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/services"
import jdgkLogo from "@/assets/jdgk-logo-new.png"

interface LoginFormProps {
  onLogin: (user: any) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Authentication Required",
        description: "Please enter both email and password.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      // Real authentication using our auth service
      const response = await auth.login({ email, password })
      
      onLogin(response.user)
      
      toast({
        title: "Authentication Successful",
        description: `Welcome back! Logged in as ${response.user.role}.`,
      })
      
      navigate("/dashboard")
    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: "Authentication Failed",
        description: error?.error?.message || "Invalid credentials. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border focus:ring-primary focus:border-primary"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-border focus:ring-primary focus:border-primary pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
            Forgot password?
          </Button>
        </div>
        
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      
      {/* Demo Info */}
      <div className="text-xs text-muted-foreground text-center border-t border-border pt-4 space-y-2">
        <p className="font-medium text-foreground">Demo Accounts Available:</p>
        <div className="grid grid-cols-1 gap-1">
          <div className="font-mono">
            <span className="text-blue-400">admin@bank.com</span> / <span className="text-green-400">demo123</span>
          </div>
          <div className="font-mono">
            <span className="text-blue-400">manager@bank.com</span> / <span className="text-green-400">demo123</span>
          </div>
          <div className="font-mono">
            <span className="text-blue-400">agent@bank.com</span> / <span className="text-green-400">demo123</span>
          </div>
        </div>
        <p className="text-xs opacity-75">
          Additional: admin@dialcraft.com/admin123, manager@dialcraft.com/manager123, agent@dialcraft.com/agent123
        </p>
      </div>
    </div>
  )
}