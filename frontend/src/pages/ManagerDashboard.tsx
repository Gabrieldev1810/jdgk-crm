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

export default function ManagerDashboard() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedMetric, setSelectedMetric] = useState<string>("batch")
  const [selectedBank, setSelectedBank] = useState<string>("all")
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
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
  
  // Mock data - Manager specific KPIs per PRD
  const batchMetrics = [
    {
      title: "Accounts Uploaded",
      value: "2,847",
      change: "+245 this week",
      changeType: "positive" as const,
      icon: <Upload className="h-4 w-4 text-accent" />,
      description: "Total active"
    },
    {
      title: "Accounts Touched",
      value: "1,923",
      change: "67.5% touch rate",
      changeType: "positive" as const,
      icon: <CheckCircle className="h-4 w-4 text-accent" />,
      description: "This month"
    },
    {
      title: "Untouched Accounts",
      value: "924",
      change: "32.5% remaining",
      changeType: "neutral" as const,
      icon: <Users className="h-4 w-4 text-warning" />,
      description: "Need attention"
    }
  ]
  
  const callMetrics = [
    {
      title: "Total Calls",
      value: "8,456",
      change: "+15% from last month",
      changeType: "positive" as const,
      icon: <Phone className="h-4 w-4 text-accent" />,
      description: "This month"
    },
    {
      title: "Connected Calls",
      value: "5,234",
      change: "61.9% connect rate",
      changeType: "positive" as const,
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      description: "Successful contacts"
    },
    {
      title: "PTPs Generated",
      value: "1,287",
      change: "+8% vs last month",
      changeType: "positive" as const,
      icon: <Target className="h-4 w-4 text-warning" />,
      description: "Payment promises"
    }
  ]
  
  const financialMetrics = [
    {
      title: "Total Collections",
      value: "$287,450",
      change: "+22% from last month",
      changeType: "positive" as const,
      icon: <DollarSign className="h-4 w-4 text-success" />,
      description: "This month"
    },
    {
      title: "Quota Progress",
      value: "78%",
      change: "On track for target",
      changeType: "positive" as const,
      icon: <TrendingUp className="h-4 w-4 text-accent" />,
      description: "Monthly goal"
    },
    {
      title: "Collection Rate",
      value: "24.6%",
      change: "+3.2% improvement",
      changeType: "positive" as const,
      icon: <BarChart3 className="h-4 w-4 text-accent" />,
      description: "Success ratio"
    }
  ]
  
  // Metric categories
  const metricCategories = {
    batch: { title: "Batch Metrics", data: batchMetrics },
    calls: { title: "Call Metrics", data: callMetrics },
    financial: { title: "Financial Metrics", data: financialMetrics }
  }

  // Agent Leaderboard
  const agentLeaderboard = [
    { name: "Sarah Johnson", collections: "$45,230", ptps: 156, rate: "82%" },
    { name: "Mike Rodriguez", collections: "$42,890", ptps: 143, rate: "79%" },
    { name: "Emma Davis", collections: "$38,760", ptps: 134, rate: "76%" },
    { name: "John Smith", collections: "$35,420", ptps: 128, rate: "73%" },
    { name: "Lisa Chen", collections: "$33,180", ptps: 119, rate: "71%" }
  ]
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {metricCategories[selectedMetric as keyof typeof metricCategories].data.map((metric, index) => (
          <ManagerKPICard key={index} {...metric} />
        ))}
      </div>

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
              <div className="text-xl md:text-2xl font-bold text-foreground font-mono">$287,450</div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-success font-medium">2.1%</span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Sales from 1-6 Dec, 2020</div>
              {/* Simple bar chart representation */}
              <div className="flex items-end space-x-1 h-12 md:h-16">
                {[40, 65, 45, 70, 85, 50, 75, 60, 80, 90, 70, 85].map((height, i) => (
                  <div 
                    key={i} 
                    className="bg-accent rounded-sm flex-1 opacity-80 hover:opacity-100 transition-opacity" 
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>• Last 6 days</span>
                <span>• Last Week</span>
              </div>
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
              <div className="text-xs text-muted-foreground">From 1-6 Dec, 2020</div>
              {/* Donut chart representation */}
              <div className="flex items-center justify-center relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-6 md:border-8 border-muted relative">
                  <div className="absolute inset-0 rounded-full border-6 md:border-8 border-transparent border-t-accent transform rotate-45"></div>
                  <div className="absolute inset-1 md:inset-2 rounded-full bg-primary flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-primary-foreground text-xs font-medium">Afternoon</div>
                      <div className="text-primary-foreground text-sm md:text-lg font-bold font-mono">1,890</div>
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
                  <div className="text-foreground font-medium">40%</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-accent rounded-full mr-1"></div>
                    <span className="text-muted-foreground text-xs">Evening</span>
                  </div>
                  <div className="text-foreground font-medium">32%</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div className="w-2 h-2 bg-muted rounded-full mr-1"></div>
                    <span className="text-muted-foreground text-xs">Morning</span>
                  </div>
                  <div className="text-foreground font-medium">28%</div>
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
              <div className="text-xl md:text-2xl font-bold text-foreground font-mono">2,568</div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-success font-medium">2.1%</span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Results from 1-6 Dec, 2020</div>
              {/* Line chart representation */}
              <div className="h-12 md:h-16 flex items-end">
                <svg className="w-full h-full" viewBox="0 0 200 60">
                  <polyline
                    fill="none"
                    stroke="hsl(var(--accent))"
                    strokeWidth="2"
                    points="10,50 30,40 50,45 70,30 90,25 110,35 130,20 150,15 170,10 190,5"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>• Last 6 days</span>
                <span>• Last Week</span>
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
                        <div className="text-accent text-sm md:text-lg font-bold font-mono">85%</div>
                        <div className="text-xs text-muted-foreground">Quality</div>
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
                        <div className="text-warning text-sm md:text-lg font-bold font-mono">85%</div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
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
                        <div className="text-success text-sm md:text-lg font-bold font-mono">92%</div>
                        <div className="text-xs text-muted-foreground">On-time</div>
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
              {[
                { name: "Sarah Johnson", amount: "$48,230", avatar: "SJ" },
                { name: "Mike Rodriguez", amount: "$42,890", avatar: "MR" },
                { name: "Emma Davis", amount: "$38,760", avatar: "ED" },
                { name: "John Smith", amount: "$35,420", avatar: "JS" }
              ].map((agent, index) => (
                <div key={agent.name} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-glass-light/20 transition-colors">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-foreground text-xs font-medium">{agent.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{agent.name}</div>
                  </div>
                  <div className="text-sm font-mono font-bold text-success flex-shrink-0">{agent.amount}</div>
                </div>
              ))}
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
              <div className="text-xl md:text-2xl font-bold text-foreground font-mono">24</div>
              <div className="flex items-center text-sm">
                <ArrowUp className="h-3 w-3 text-success mr-1" />
                <span className="text-success font-medium">8.2%</span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </div>
              <div className="text-xs text-muted-foreground mb-3">Active agents online</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Online</span>
                  <span className="text-success font-medium">18 agents</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">On Break</span>
                  <span className="text-warning font-medium">4 agents</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Offline</span>
                  <span className="text-muted-foreground font-medium">2 agents</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}