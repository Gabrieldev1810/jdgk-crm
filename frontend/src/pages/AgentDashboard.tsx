import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Phone, 
  DollarSign, 
  Clock,
  CheckCircle,
  Target,
  PhoneCall,
  TrendingUp
} from "lucide-react"
import { dashboardService, DashboardMetrics, AgentPerformance } from "@/services/dashboard"
import { auth } from "@/services/auth"

interface AgentKPICardProps {
  title: string
  value: string
  target?: string
  progress?: number
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: React.ReactNode
  description?: string
}

function AgentKPICard({ title, value, target, progress, change, changeType, icon, description }: AgentKPICardProps) {
  const [displayValue, setDisplayValue] = useState("0")
  
  useEffect(() => {
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''))
    if (isNaN(numericValue)) {
      setDisplayValue(value)
      return
    }
    
    let current = 0
    const increment = numericValue / 30
    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current).toString())
      }
    }, 50)
    
    return () => clearInterval(timer)
  }, [value])
  
  const changeColor = changeType === "positive" ? "text-success" : 
                     changeType === "negative" ? "text-destructive" : "text-muted-foreground"
  
  return (
    <Card className="glass-card hover:shadow-accent transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="p-2 bg-accent/10 rounded-lg">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold font-mono text-foreground">
              {displayValue}
            </div>
            {target && (
              <div className="text-sm text-muted-foreground">
                / {target}
              </div>
            )}
          </div>
          
          {progress !== undefined && (
            <Progress value={progress} className="h-2" />
          )}
          
          <div className="flex items-center justify-between">
            <p className={`text-xs font-medium ${changeColor}`}>
              {change}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AgentDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [currentAgent, setCurrentAgent] = useState<AgentPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load agent-specific data
  useEffect(() => {
    const loadAgentData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get current user
        const user = auth.getUser()
        if (!user) {
          setError('User not found')
          return
        }
        
        // Get dashboard data
        const data = await dashboardService.getDashboardMetrics()
        setDashboardData(data)
        
        // Find current agent in the agent performance data
        const agent = data.topAgents.find(a => 
          a.email === user.email || 
          a.name === `${user.firstName} ${user.lastName}`
        )
        
        // If not in top agents, create agent data from user
        if (agent) {
          setCurrentAgent(agent)
        } else {
          setCurrentAgent({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            callsToday: Math.floor(Math.random() * 30) + 20, // Mock for now
            totalCalls: Math.floor(Math.random() * 200) + 100, // Mock for now
            collections: Math.floor(Math.random() * 20000) + 5000, // Mock for now
            contactRate: Math.floor(Math.random() * 20) + 65, // Mock for now
            avgCallDuration: Math.floor(Math.random() * 100) + 150, // Mock for now
          })
        }
      } catch (err) {
        console.error('Failed to load agent data:', err)
        setError('Failed to load agent data')
      } finally {
        setLoading(false)
      }
    }

    loadAgentData()
    
    // Refresh data every 5 minutes
    const dataRefreshInterval = setInterval(loadAgentData, 5 * 60 * 1000)
    
    return () => clearInterval(dataRefreshInterval)
  }, [])
  
  // Generate Agent KPIs from real data
  const agentKPIs = currentAgent && dashboardData ? [
    {
      title: "Accounts Assigned",
      value: Math.floor(dashboardData.totalAccounts / dashboardData.totalAgents).toString(),
      target: "50",
      progress: Math.min((Math.floor(dashboardData.totalAccounts / dashboardData.totalAgents) / 50) * 100, 100),
      change: "+5",
      changeType: "positive" as const,
      icon: <Users className="w-5 h-5" />,
      description: "assigned to you"
    },
    {
      title: "Accounts Worked",
      value: Math.floor(currentAgent.callsToday * 0.7).toString(),
      target: "40", 
      progress: Math.min((Math.floor(currentAgent.callsToday * 0.7) / 40) * 100, 100),
      change: "+8",
      changeType: "positive" as const,
      icon: <Target className="w-5 h-5" />,
      description: "touched accounts"
    },
    {
      title: "Calls Made",
      value: currentAgent.callsToday.toString(),
      target: "60",
      progress: Math.min((currentAgent.callsToday / 60) * 100, 100),
      change: "+12",
      changeType: "positive" as const,
      icon: <Phone className="w-5 h-5" />,
      description: "total calls today"
    },
    {
      title: "Successful Connections",
      value: Math.floor(currentAgent.callsToday * (currentAgent.contactRate / 100)).toString(),
      target: "45", 
      progress: Math.min((Math.floor(currentAgent.callsToday * (currentAgent.contactRate / 100)) / 45) * 100, 100),
      change: "+8",
      changeType: "positive" as const,
      icon: <PhoneCall className="w-5 h-5" />,
      description: "connected calls"
    },
    {
      title: "PTPs This Month",
      value: Math.floor(currentAgent.callsToday * 0.3).toString(),
      target: "20",
      progress: Math.min((Math.floor(currentAgent.callsToday * 0.3) / 20) * 100, 100),
      change: "+3",
      changeType: "positive" as const,
      icon: <CheckCircle className="w-5 h-5" />,
      description: "promises to pay secured"
    },
    {
      title: "Collections vs Quota",
      value: `$${currentAgent.collections.toLocaleString()}`,
      target: "$15,000",
      progress: Math.min((currentAgent.collections / 15000) * 100, 100),
      change: "+$1,200",
      changeType: "positive" as const,
      icon: <DollarSign className="w-5 h-5" />,
      description: "monthly collection goal"
    },
    {
      title: "Avg Handling Time",
      value: `${Math.floor(currentAgent.avgCallDuration / 60)}:${(currentAgent.avgCallDuration % 60).toString().padStart(2, '0')}`,
      change: "-0:15",
      changeType: "positive" as const,
      icon: <Clock className="w-5 h-5" />,
      description: "per call average"
    },
    {
      title: "Contact Rate",
      value: `${currentAgent.contactRate}%`,
      change: "+5%",
      changeType: "positive" as const,
      icon: <TrendingUp className="w-5 h-5" />,
      description: "successful connections"
    }
  ] : []
  
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Agent Welcome Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground mb-2">
              {loading ? "Loading..." : currentAgent ? `Welcome, ${currentAgent.name.split(' ')[0]}!` : "Agent Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })} • Your performance metrics and assigned accounts
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-accent text-accent">
              <CheckCircle className="w-3 h-3 mr-1" />
              Online
            </Badge>
            <Button className="bg-gradient-accent hover:shadow-accent">
              <PhoneCall className="w-4 h-4 mr-2" />
              Start Dialing
            </Button>
          </div>
        </div>
      </div>
      
      {/* Agent KPI Cards */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20 mb-2"></div>
                <div className="h-2 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="glass-card border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p className="text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agentKPIs.map((kpi, index) => (
            <div key={kpi.title} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <AgentKPICard {...kpi} />
            </div>
          ))}
        </div>
      )}
      
      {/* Today's Focus */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-accent" />
              <span>Today's Goals</span>
            </CardTitle>
            <CardDescription>
              Your daily targets and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accounts to Contact</span>
                <span className="font-mono">47/75</span>
              </div>
              <Progress value={63} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Call Target</span>
                <span className="font-mono">32/50</span>
              </div>
              <Progress value={64} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Collection Goal</span>
                <span className="font-mono">$2,450/$3,000</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-accent" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Your latest call outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-2 bg-success/5 rounded">
                <div className="flex items-center space-x-2">
                  <span>💰</span>
                  <span>John Smith - Collected</span>
                </div>
                <span className="text-success font-mono">$1,200</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-warning/5 rounded">
                <div className="flex items-center space-x-2">
                  <span>✅</span>
                  <span>Sarah Johnson - PTP</span>
                </div>
                <span className="text-warning font-mono">Jan 20</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/5 rounded">
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>Mike Brown - No Answer</span>
                </div>
                <span className="text-muted-foreground font-mono">10:45 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-accent" />
              <span>Next Account</span>
            </CardTitle>
            <CardDescription>
              Your next account to contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="font-semibold text-foreground">Emily Davis</div>
              <div className="text-sm text-muted-foreground">ACC-004</div>
              <div className="font-mono text-sm">$3,200.00</div>
              <div className="text-xs text-destructive">Due: Jan 25, 2024</div>
              <Badge variant="secondary" className="text-xs">
                🔴 Untouched
              </Badge>
            </div>
            <Button className="w-full bg-gradient-accent hover:shadow-accent">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}