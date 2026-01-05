import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Phone, 
  DollarSign, 
  TrendingUp,
  Upload,
  Target,
  CheckCircle,
  Award,
  BarChart3,
  Clock,
  ChevronDown,
  Eye,
  ArrowUp,
  ArrowDown,
  User,
  Building2
} from "lucide-react"
import { dashboardService, DashboardMetrics } from "@/services/dashboard"

interface ManagerKPICardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: React.ReactNode
  description?: string
}

function ManagerKPICard({ title, value, change, changeType, icon, description }: ManagerKPICardProps) {
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
        <div className="text-xl md:text-2xl font-bold font-mono text-foreground mb-1">
          {displayValue}
        </div>
        <div className="flex items-center space-x-2">
          <p className={`text-xs font-medium ${changeColor}`}>
            {change}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { RealtimeReport } from "@/components/vicidial/RealtimeReport"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedMetric, setSelectedMetric] = useState<string>("team")
  const [selectedBank, setSelectedBank] = useState<string>("all")
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await dashboardService.getDashboardMetrics()
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
    
    // Refresh data every 5 minutes
    const dataRefreshInterval = setInterval(loadDashboardData, 5 * 60 * 1000)
    
    return () => clearInterval(dataRefreshInterval)
  }, [])
  
  // Bank partners list
  const bankPartners = [
    { value: "all", label: "All Banks" },
    { value: "Rcbc", label: "RCBC" },
    { value: "Fundline", label: "Fundline" },
    { value: "Amg", label: "AMG" },
    { value: "Simbayanan", label: "Simbayanan" },
    { value: "Flexi", label: "Flexi" },
    { value: "Tfs", label: "TFS" },
    { value: "JACCS", label: "JACCS" },
    { value: "Radiowealth", label: "Radiowealth" },
    { value: "Ctbc", label: "CTBC" },
    { value: "Ewb", label: "EWB" },
    { value: "Bdo", label: "BDO" }
  ]
  
  // Handle navigation to Accounts with bank filter
  const handleViewAccounts = () => {
    const params = selectedBank !== "all" ? `?bank=${selectedBank}` : ""
    navigate(`/accounts${params}`)
  }
  
  // Generate metrics from real dashboard data
  const batchMetrics = dashboardData ? [
    {
      title: "Accounts Uploaded",
      value: dashboardData.totalAccounts.toLocaleString(),
      change: `+${dashboardData.newAccountsThisWeek} this week`,
      changeType: "positive" as const,
      icon: <Upload className="h-4 w-4 text-accent" />,
      description: "Total active"
    },
    {
      title: "Accounts Touched",
      value: dashboardData.touchedAccounts.toLocaleString(),
      change: `${((dashboardData.touchedAccounts / dashboardData.totalAccounts) * 100).toFixed(1)}% touch rate`,
      changeType: "positive" as const,
      icon: <CheckCircle className="h-4 w-4 text-accent" />,
      description: "This period"
    },
    {
      title: "Untouched Accounts",
      value: (dashboardData.totalAccounts - dashboardData.touchedAccounts).toLocaleString(),
      change: `${(((dashboardData.totalAccounts - dashboardData.touchedAccounts) / dashboardData.totalAccounts) * 100).toFixed(1)}% remaining`,
      changeType: "neutral" as const,
      icon: <Users className="h-4 w-4 text-warning" />,
      description: "Need attention"
    }
  ] : []
  
  const callMetrics = dashboardData ? [
    {
      title: "Total Calls Today",
      value: dashboardData.totalCallsToday.toLocaleString(),
      change: `Weekly: ${dashboardData.totalCallsThisWeek.toLocaleString()}`,
      changeType: "positive" as const,
      icon: <Phone className="h-4 w-4 text-accent" />,
      description: "Daily volume"
    },
    {
      title: "Contact Rate",
      value: `${dashboardData.contactRate.toFixed(1)}%`,
      change: "Connection success",
      changeType: "positive" as const,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      description: "Successful contacts"
    },
    {
      title: "Avg Call Duration",
      value: `${Math.floor(dashboardData.averageCallDuration / 60)}:${(dashboardData.averageCallDuration % 60).toString().padStart(2, '0')}`,
      change: "Minutes per call",
      changeType: "neutral" as const,
      icon: <Clock className="h-4 w-4 text-accent" />,
      description: "Talk time"
    }
  ] : []
  
  const financialMetrics = dashboardData ? [
    {
      title: "Total Collections",
      value: `$${(dashboardData.totalCollected / 1000).toFixed(0)}K`,
      change: `Rate: ${dashboardData.collectionRate.toFixed(1)}%`,
      changeType: "positive" as const,
      icon: <DollarSign className="h-4 w-4 text-success" />,
      description: "Total collected"
    },
    {
      title: "Average Collection",
      value: `$${dashboardData.averageCollection.toLocaleString()}`,
      change: "Per successful account",
      changeType: "positive" as const,
      icon: <TrendingUp className="h-4 w-4 text-accent" />,
      description: "Collection average"
    },
    {
      title: "Active Agents",
      value: `${dashboardData.activeAgents}/${dashboardData.totalAgents}`,
      change: `${((dashboardData.activeAgents / dashboardData.totalAgents) * 100).toFixed(0)}% active`,
      changeType: "positive" as const,
      icon: <User className="h-4 w-4 text-accent" />,
      description: "Agent utilization"
    }
  ] : []
  
  const teamMetrics = dashboardData ? [
    {
      title: "Team Accounts Assigned",
      value: dashboardData.totalAccounts.toLocaleString(),
      change: "Total assigned",
      changeType: "neutral" as const,
      icon: <Users className="h-4 w-4 text-accent" />,
      description: "Active portfolio"
    },
    {
      title: "Team Accounts Worked",
      value: dashboardData.touchedAccounts.toLocaleString(),
      change: `${((dashboardData.touchedAccounts / dashboardData.totalAccounts) * 100).toFixed(1)}% coverage`,
      changeType: "positive" as const,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      description: "Accounts contacted"
    },
    {
      title: "Team Calls Made",
      value: dashboardData.totalCallsToday.toLocaleString(),
      change: "Today's volume",
      changeType: "neutral" as const,
      icon: <Phone className="h-4 w-4 text-accent" />,
      description: "Outbound calls"
    },
    {
      title: "Team Collections vs Quota",
      value: `$${(dashboardData.totalCollected / 1000).toFixed(1)}K`,
      change: dashboardData.teamQuota ? `${((dashboardData.totalCollected / dashboardData.teamQuota) * 100).toFixed(1)}% of goal` : "No quota set",
      changeType: "positive" as const,
      icon: <Target className="h-4 w-4 text-warning" />,
      description: dashboardData.teamQuota ? `Target: $${(dashboardData.teamQuota / 1000).toFixed(1)}K` : "Target: N/A"
    }
  ] : []
  
  // Metric categories
  const metricCategories = {
    team: { title: "Team Summary", data: teamMetrics },
    batch: { title: "Batch Metrics", data: batchMetrics },
    calls: { title: "Call Metrics", data: callMetrics },
    financial: { title: "Financial Metrics", data: financialMetrics }
  }

  // Agent Leaderboard from real data
  const agentLeaderboard = dashboardData ? dashboardData.topAgents.map(agent => ({
    name: agent.name,
    collections: `$${agent.collections.toLocaleString()}`,
    ptps: agent.callsToday, // Using calls today as proxy for PTPs until we have that data
    rate: `${agent.contactRate}%`
  })) : []
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="realtime">Real-time Report</TabsTrigger>
            </TabsList>
        </div>

        <TabsContent value="realtime">
            <RealtimeReport />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
      {/* Header with KPI Selector */}
      <div className="glass-card p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4 md:mb-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold font-poppins text-foreground mb-2">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {currentTime.toLocaleString("en-US", {
                weekday: "long",
                year: "numeric", 
                month: "long",
                day: "numeric"
              })} • Performance Analytics
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Badge variant="outline" className="border-success text-success self-center sm:self-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              All Systems Online
            </Badge>
            
            {/* Bank Filter */}
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full sm:w-48 bg-glass-light/50 backdrop-blur-sm border-glass-border hover:bg-glass-light/70 transition-colors">
                <SelectValue placeholder="Select Bank" />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
                {bankPartners.map((bank) => (
                  <SelectItem key={bank.value} value={bank.value} className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-accent" />
                      <span>{bank.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* KPI Selector */}
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full sm:w-48 bg-glass-light/50 backdrop-blur-sm border-glass-border hover:bg-glass-light/70 transition-colors">
                <SelectValue placeholder="Select KPIs" />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
                <SelectItem value="team" className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-accent" />
                    <span>Team Summary</span>
                  </div>
                </SelectItem>
                <SelectItem value="batch" className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4 text-accent" />
                    <span>Batch Metrics</span>
                  </div>
                </SelectItem>
                <SelectItem value="calls" className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-accent" />
                    <span>Call Metrics</span>
                  </div>
                </SelectItem>
                <SelectItem value="financial" className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span>Financial Metrics</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-20 mb-2"></div>
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
      ) : dashboardData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {metricCategories[selectedMetric as keyof typeof metricCategories].data.map((metric, index) => (
            <ManagerKPICard key={index} {...metric} />
          ))}
        </div>
      ) : null}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Revenue Card */}
        <Card className="glass-card border-glass-border hover:shadow-accent transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-accent hover:bg-glass-light/20 text-xs"
                onClick={handleViewAccounts}
              >
                <Eye className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">View Accounts</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-24 mb-3"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ) : dashboardData ? (
                <>
                  <div className="text-xl md:text-2xl font-bold text-foreground font-mono">
                    ${(dashboardData.totalCollected / 1000).toFixed(0)}K
                  </div>
                  <div className="flex items-center text-sm">
                    <ArrowUp className="h-3 w-3 text-success mr-1" />
                    <span className="text-success font-medium">{dashboardData.collectionRate.toFixed(1)}%</span>
                    <span className="text-muted-foreground ml-1">collection rate</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Collections from {dashboardData.totalAccounts.toLocaleString()} accounts
                  </div>
                  {/* Timeline visualization */}
                  <div className="flex items-end space-x-1 h-12 md:h-16">
                    {dashboardData.collectionsTimeline.map((data, i) => {
                      const maxValue = Math.max(...dashboardData.collectionsTimeline.map(d => d.value));
                      const height = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                      return (
                        <div 
                          key={i} 
                          className="bg-accent rounded-sm flex-1 opacity-80 hover:opacity-100 transition-opacity" 
                          style={{ height: `${Math.max(height, 10)}%` }}
                          title={`${data.label}: $${data.value.toLocaleString()}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>• Last 7 days</span>
                    <span>• Trending up</span>
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Call Time Distribution */}
        <Card className="glass-card border-glass-border hover:shadow-accent transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Call Time</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-accent hover:bg-glass-light/20 text-xs"
                onClick={handleViewAccounts}
              >
                <Eye className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">View Accounts</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">Today's Breakdown</div>
              {/* Donut chart representation */}
              <div className="flex items-center justify-center relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-6 md:border-8 border-muted relative">
                  <div className="absolute inset-0 rounded-full border-6 md:border-8 border-transparent border-t-accent transform rotate-45"></div>
                  <div className="absolute inset-1 md:inset-2 rounded-full bg-primary flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-primary-foreground text-xs font-medium">Total</div>
                      <div className="text-primary-foreground text-sm md:text-lg font-bold font-mono">
                        {dashboardData ? dashboardData.totalCallsToday.toLocaleString() : 0}
                      </div>
                      <div className="text-primary-foreground text-xs">calls</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-primary rounded-full mr-1"></div>
                    <span className="text-muted-foreground text-xs">Afternoon</span>
                  </div>
                  <div className="text-foreground font-medium">
                    {dashboardData?.timeOfDayBreakdown?.afternoon || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-accent rounded-full mr-1"></div>
                    <span className="text-muted-foreground text-xs">Evening</span>
                  </div>
                  <div className="text-foreground font-medium">
                    {dashboardData?.timeOfDayBreakdown?.evening || 0}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-muted rounded-full mr-1"></div>
                    <span className="text-muted-foreground text-xs">Morning</span>
                  </div>
                  <div className="text-foreground font-medium">
                    {dashboardData?.timeOfDayBreakdown?.morning || 0}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections */}
        <Card className="glass-card border-glass-border hover:shadow-accent transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collections</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-accent hover:bg-glass-light/20 text-xs"
                onClick={handleViewAccounts}
              >
                <Eye className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">View Accounts</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xl md:text-2xl font-bold text-foreground font-mono">
                ${dashboardData ? (dashboardData.totalCollected / 1000).toFixed(1) : 0}K
              </div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-success font-medium">
                  {dashboardData ? dashboardData.collectionRate.toFixed(1) : 0}%
                </span>
                <span className="text-muted-foreground ml-1">collection rate</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Last 7 Days</div>
              {/* Bar chart representation */}
              <div className="h-12 md:h-16 flex items-end space-x-1">
                {dashboardData?.collectionsTimeline.map((data, i) => {
                  const maxValue = Math.max(...dashboardData.collectionsTimeline.map(d => d.value));
                  const height = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                  return (
                    <div 
                      key={i} 
                      className="bg-success rounded-sm flex-1 opacity-80 hover:opacity-100 transition-opacity" 
                      style={{ height: `${Math.max(height, 10)}%` }}
                      title={`${data.label}: $${data.value.toLocaleString()}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>• Last 7 days</span>
                <span>• Trending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Agent Performance */}
        <Card className="glass-card border-glass-border hover:shadow-accent transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agent Performance</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Performance ratings across key metrics 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Donut charts for ratings */}
              <div className="flex items-center justify-center space-x-3 md:space-x-6">
                <div className="text-center">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
                    <div className="w-full h-full rounded-full border-3 md:border-4 border-muted">
                      <div className="absolute inset-0 rounded-full border-3 md:border-4 border-transparent border-t-accent border-r-accent border-b-accent transform rotate-12"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-accent text-sm md:text-lg font-bold font-mono">
                          {dashboardData ? dashboardData.contactRate.toFixed(0) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Contact</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
                    <div className="w-full h-full rounded-full border-3 md:border-4 border-muted">
                      <div className="absolute inset-0 rounded-full border-3 md:border-4 border-transparent border-t-warning border-r-warning border-b-warning border-l-warning transform -rotate-12"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-warning text-sm md:text-lg font-bold font-mono">
                          {dashboardData ? dashboardData.collectionRate.toFixed(0) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Collect</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-2">
                    <div className="w-full h-full rounded-full border-3 md:border-4 border-muted">
                      <div className="absolute inset-0 rounded-full border-3 md:border-4 border-transparent border-t-success border-r-success border-b-success border-l-success transform rotate-90"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-success text-sm md:text-lg font-bold font-mono">
                          {dashboardData ? ((dashboardData.activeAgents / (dashboardData.totalAgents || 1)) * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="glass-card border-glass-border hover:shadow-accent transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Performers</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Leading agents by collection amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                ))
              ) : agentLeaderboard.length > 0 ? (
                agentLeaderboard.map((agent, index) => {
                  const initials = agent.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  
                  return (
                    <div key={agent.name} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-glass-light/20 transition-colors">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-foreground text-xs font-medium">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">Contact Rate: {agent.rate}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-success flex-shrink-0">{agent.collections}</div>
                        <div className="text-xs text-muted-foreground">{agent.ptps} calls today</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-sm">No agent data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Status */}
        <Card className="glass-card border-glass-border hover:shadow-accent transition-all duration-300 md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Team Status</CardTitle>
              <Button variant="ghost" size="sm" className="text-accent hover:bg-glass-light/20 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">View Report</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded w-12 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              ) : dashboardData ? (
                <>
                  <div className="text-xl md:text-2xl font-bold text-foreground font-mono">
                    {dashboardData.totalAgents}
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-success font-medium">{dashboardData.activeAgents} active</span>
                    <span className="text-muted-foreground ml-1">
                      • {((dashboardData.activeAgents / (dashboardData.totalAgents || 1)) * 100).toFixed(0)}% utilization
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xl md:text-2xl font-bold text-foreground font-mono">--</div>
              )}
              <div className="flex items-center text-sm">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-success font-medium">8.2%</span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Active agents online</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Online</span>
                  <span className="text-success font-medium">
                    {dashboardData ? dashboardData.activeAgents : 0} agents
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Offline</span>
                  <span className="text-muted-foreground font-medium">
                    {dashboardData ? (dashboardData.totalAgents - dashboardData.activeAgents) : 0} agents
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="glass-card hover:shadow-accent transition-all duration-300 cursor-pointer" onClick={() => navigate('/dispositions')}>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Target className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="font-medium">Dispositions</div>
              <div className="text-xs text-muted-foreground">Manage call outcomes</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-accent transition-all duration-300 cursor-pointer" onClick={() => navigate('/tasks')}>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="font-medium">Team Tasks</div>
              <div className="text-xs text-muted-foreground">View and assign tasks</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card hover:shadow-accent transition-all duration-300 cursor-pointer" onClick={() => navigate('/users')}>
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="font-medium">Agents</div>
              <div className="text-xs text-muted-foreground">Manage team members</div>
            </div>
          </CardContent>
        </Card>
      </div>
      </TabsContent>
      </Tabs>
    </div>
  )
}