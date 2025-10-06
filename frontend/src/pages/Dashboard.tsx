import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AgentDashboard from "./AgentDashboard"
import ManagerDashboard from "./ManagerDashboard"
import { 
  DollarSign, 
  Phone,
  Users,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  showViewReport?: boolean
}

function MetricCard({ title, value, subtitle, change, changeType, showViewReport }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState("0")
  
  useEffect(() => {
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''))
    if (isNaN(numericValue)) {
      setDisplayValue(value)
      return
    }
    
    let current = 0
    const increment = numericValue / 40
    const timer = setInterval(() => {
      current += increment
      if (current >= numericValue) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        const formattedValue = value.includes('$') ? `$${Math.floor(current).toLocaleString()}` :
                              value.includes('%') ? `${Math.floor(current)}%` :
                              Math.floor(current).toLocaleString()
        setDisplayValue(formattedValue)
      }
    }, 30)
    
    return () => clearInterval(timer)
  }, [value])
  
  const getChangeIcon = () => {
    if (changeType === "positive") return <ArrowUpRight className="w-3 h-3 text-success" />
    if (changeType === "negative") return <ArrowDownRight className="w-3 h-3 text-destructive" />
    return <Minus className="w-3 h-3 text-muted-foreground" />
  }
  
  const getChangeColor = () => {
    if (changeType === "positive") return "text-success"
    if (changeType === "negative") return "text-destructive"
    return "text-muted-foreground"
  }
  
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {showViewReport && (
            <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent-foreground p-0 h-auto">
              View Report
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground">
            {displayValue}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
          {change && (
            <div className={`flex items-center space-x-1 text-xs ${getChangeColor()}`}>
              {getChangeIcon()}
              <span>{change}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardProps {
  userRole?: string
}

export default function Dashboard({ userRole = "agent" }: DashboardProps) {
  // Normalize role to lowercase for comparison
  const normalizedRole = userRole.toLowerCase()
  
  // Route to appropriate dashboard based on user role
  if (normalizedRole === "agent") {
    return <AgentDashboard />
  } else if (normalizedRole === "manager" || normalizedRole === "admin" || normalizedRole === "super_admin") {
    return <ManagerDashboard />
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Top Row - Collections & Calls */}
        <div className="grid gap-6 md:grid-cols-2">
          <MetricCard
            title="Collections"
            value="$2,847,500"
            subtitle="Collections from 1-30 Dec, 2020"
            change="21% vs last month"
            changeType="positive"
            showViewReport={true}
          />
          
          <div className="space-y-4">
            <MetricCard
              title="Call Time"
              value="1,890 calls"
              subtitle="From 1-30 Dec, 2020"
              showViewReport={true}
            />
            
            {/* Call Distribution */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-foreground">40%</div>
                    <div className="text-xs text-muted-foreground">Morning</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">35%</div>
                    <div className="text-xs text-muted-foreground">Afternoon</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">25%</div>
                    <div className="text-xs text-muted-foreground">Evening</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Middle Row - Performance & Accounts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Agent Performance */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">Agent Performance</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent-foreground p-0 h-auto">
                  View Report
                </Button>
              </div>
              <CardDescription className="text-xs">
                Performance metrics for collection agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Top Collector</div>
                      <div className="text-xs text-muted-foreground">$48,000 collected</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">85%</div>
                    <div className="text-xs text-success">Success Rate</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Most Calls</div>
                      <div className="text-xs text-muted-foreground">245 calls made</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">92%</div>
                    <div className="text-xs text-accent">Connect Rate</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Status */}
          <div className="space-y-4">
            <MetricCard
              title="Accounts"
              value="2,568"
              subtitle="Collections from 1-30 Dec, 2020"
              change="21% vs last week"
              changeType="positive"
              showViewReport={true}
            />
            
            {/* Account Distribution */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span className="text-sm">Collected</span>
                    </div>
                    <div className="text-sm font-medium">1,247</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warning rounded-full"></div>
                      <span className="text-sm">PTP</span>
                    </div>
                    <div className="text-sm font-medium">823</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive rounded-full"></div>
                      <span className="text-sm">Not Collected</span>
                    </div>
                    <div className="text-sm font-medium">498</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Bottom Row - Recent Activity & Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Collections</CardTitle>
              <CardDescription className="text-xs">Latest successful collections today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 border-b border-border/30 last:border-b-0">
                  <div>
                    <div className="font-medium text-sm">Account #12457</div>
                    <div className="text-xs text-muted-foreground">John Smith</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">$1,250</div>
                    <div className="text-xs text-muted-foreground">2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border-b border-border/30 last:border-b-0">
                  <div>
                    <div className="font-medium text-sm">Account #12458</div>
                    <div className="text-xs text-muted-foreground">Sarah Johnson</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">$890</div>
                    <div className="text-xs text-muted-foreground">4 hours ago</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2">
                  <div>
                    <div className="font-medium text-sm">Account #12459</div>
                    <div className="text-xs text-muted-foreground">Mike Davis</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-success">$2,100</div>
                    <div className="text-xs text-muted-foreground">6 hours ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <Button className="justify-start bg-accent/10 hover:bg-accent/20 text-accent border-accent/20" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Start Dialing Session
                </Button>
                <Button className="justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Upload New Accounts
                </Button>
                <Button className="justify-start" variant="outline">
                  <Target className="w-4 h-4 mr-2" />
                  View Assigned Accounts
                </Button>
                <Button className="justify-start" variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}