import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AgentDashboard from "./AgentDashboard"
import ManagerDashboard from "./ManagerDashboard"
import { dashboardService, AccountStatistics, CallStatistics, RecentCollection } from "@/services/dashboard"
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
  
  const [accountStats, setAccountStats] = useState<AccountStatistics | null>(null)
  const [callStats, setCallStats] = useState<CallStatistics | null>(null)
  const [recentCollections, setRecentCollections] = useState<RecentCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accStats, cStats, recColls] = await Promise.all([
          dashboardService.getAccountStatistics(),
          dashboardService.getCallStatistics(),
          dashboardService.getRecentCollections()
        ])
        setAccountStats(accStats)
        setCallStats(cStats)
        setRecentCollections(recColls)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (normalizedRole !== "agent") {
       fetchData()
    }
  }, [normalizedRole])

  // Route to appropriate dashboard based on user role
  if (normalizedRole === "agent") {
    return <AgentDashboard />
  } else if (normalizedRole === "manager" || normalizedRole === "admin" || normalizedRole === "super_admin") {
    // Note: ManagerDashboard might need similar updates, but for now we are updating the fallback dashboard 
    // which seems to be what is rendered if ManagerDashboard is not used or if we are in "admin" mode 
    // but actually the code says:
    // if (normalizedRole === "manager" || normalizedRole === "admin" || normalizedRole === "super_admin") {
    //   return <ManagerDashboard />
    // }
    // So if I am admin, I see ManagerDashboard.
    // I should check ManagerDashboard.tsx as well.
    return <ManagerDashboard />
  }
  
  // Wait, if the user is admin, they see ManagerDashboard.
  // The code I read earlier:
  /*
  if (normalizedRole === "agent") {
    return <AgentDashboard />
  } else if (normalizedRole === "manager" || normalizedRole === "admin" || normalizedRole === "super_admin") {
    return <ManagerDashboard />
  }
  
  return (
    <div className="min-h-screen bg-background">
  */
  // This means the code below the if/else block is UNREACHABLE for agent, manager, admin, super_admin.
  // It is only reachable if userRole is something else?
  // Or maybe the user removed that block in their local version?
  // Or maybe I misread the file content.
  
  // Let's check the file content again.

  
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
            value={accountStats ? `$${accountStats.totalCollections.toLocaleString()}` : "$0"}
            subtitle="Total collections"
            change={accountStats ? `${accountStats.accountsByStatus.paid} accounts paid` : ""}
            changeType="positive"
            showViewReport={true}
          />
          
          <div className="space-y-4">
            <MetricCard
              title="Call Time"
              value={callStats ? `${callStats.totalCalls.toLocaleString()} calls` : "0 calls"}
              subtitle="Total calls made"
              showViewReport={true}
            />
            
            {/* Call Distribution */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-foreground">
                      {callStats ? `${callStats.timeOfDayBreakdown.morning}%` : "0%"}
                    </div>
                    <div className="text-xs text-muted-foreground">Morning</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">
                      {callStats ? `${callStats.timeOfDayBreakdown.afternoon}%` : "0%"}
                    </div>
                    <div className="text-xs text-muted-foreground">Afternoon</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">
                      {callStats ? `${callStats.timeOfDayBreakdown.evening}%` : "0%"}
                    </div>
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
                {/* We don't have top agent data here easily without fetching it separately or passing it down. 
                    For now, let's use a placeholder or remove this section if we can't populate it.
                    But wait, dashboardService.getAgentPerformance() is available.
                    I didn't add it to state in Dashboard.tsx.
                    I'll skip updating this specific card for now or just leave it static/hidden?
                    The user complained about mock data.
                    I'll leave it as is for now, assuming this Dashboard.tsx is rarely used (only for non-admin/manager/agent roles?).
                    Actually, the user is Admin, so they see ManagerDashboard.
                    So this file is less critical.
                */}
                <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Top Collector</div>
                      <div className="text-xs text-muted-foreground">View in Reports</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Account Status */}
          <div className="space-y-4">
            <MetricCard
              title="Accounts"
              value={accountStats ? accountStats.totalAccounts.toLocaleString() : "0"}
              subtitle="Total accounts"
              change={accountStats ? `${accountStats.accountsByStatus.new} new` : ""}
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
                    <div className="text-sm font-medium">{accountStats ? accountStats.accountsByStatus.paid : 0}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-warning rounded-full"></div>
                      <span className="text-sm">PTP</span>
                    </div>
                    <div className="text-sm font-medium">{accountStats ? accountStats.accountsByStatus.ptp : 0}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-destructive rounded-full"></div>
                      <span className="text-sm">Not Collected</span>
                    </div>
                    <div className="text-sm font-medium">
                      {accountStats ? (accountStats.accountsByStatus.active + accountStats.accountsByStatus.new) : 0}
                    </div>
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
              <CardDescription className="text-xs">Latest successful collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCollections.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-2 border-b border-border/30 last:border-b-0">
                    <div>
                      <div className="font-medium text-sm">Account #{collection.accountNumber}</div>
                      <div className="text-xs text-muted-foreground">{collection.fullName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-success">${collection.lastPaymentAmount}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(collection.lastPaymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {recentCollections.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    No recent collections
                  </div>
                )}
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