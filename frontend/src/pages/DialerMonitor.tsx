import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { vicidialService, VicidialCampaign, VicidialLiveAgent } from '@/services/vicidial'
import { Phone, Users, Activity, PhoneOff, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CampaignStats {
  total_calls: number;
  drops: number;
  sales: number;
  answered: number;
}

export default function DialerMonitor() {
  const [campaigns, setCampaigns] = useState<VicidialCampaign[]>([])
  const [liveAgents, setLiveAgents] = useState<VicidialLiveAgent[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string>("")
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [selectedCampaign])

  const loadData = async () => {
    try {
      const [campaignsData, agentsData] = await Promise.all([
        vicidialService.getCampaigns(),
        vicidialService.getLiveAgents(selectedCampaign && selectedCampaign !== "all" ? selectedCampaign : undefined)
      ])
      
      setCampaigns(campaignsData)
      setLiveAgents(agentsData)

      if (selectedCampaign && selectedCampaign !== "all") {
        const statsData = await vicidialService.getCampaignStats(selectedCampaign)
        setStats(statsData)
      } else {
        setStats(null)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load dialer data:', error)
    }
  }

  const toggleCampaign = async (campaignId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'Y' ? false : true
      await vicidialService.updateCampaignStatus(campaignId, newStatus)
      toast.success(`Campaign ${newStatus ? 'activated' : 'deactivated'}`)
      loadData()
    } catch (error) {
      toast.error('Failed to update campaign status')
    }
  }

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'INCALL': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'PAUSED': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6 p-6 pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dialer Monitor</h1>
          <p className="text-muted-foreground">Real-time campaign and agent monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[200px] glass-light border-glass-border">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map(c => (
                <SelectItem key={c.campaign_id} value={c.campaign_id}>
                  {c.campaign_id} - {c.campaign_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} className="glass-light border-glass-border">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {selectedCampaign && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card border-glass-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls (Today)</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_calls}</div>
            </CardContent>
          </Card>
          <Card className="glass-card border-glass-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Answered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.answered}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_calls > 0 ? Math.round((stats.answered / stats.total_calls) * 100) : 0}% Answer Rate
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-glass-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drops</CardTitle>
              <PhoneOff className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drops}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_calls > 0 ? Math.round((stats.drops / stats.total_calls) * 100) : 0}% Drop Rate
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-glass-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sales}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaigns List */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Manage campaign status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.campaign_id} className="border-glass-border hover:bg-glass-light/50">
                    <TableCell className="font-medium">{campaign.campaign_id}</TableCell>
                    <TableCell>{campaign.campaign_name}</TableCell>
                    <TableCell>
                      <Badge variant={campaign.active === 'Y' ? 'default' : 'secondary'} 
                        className={campaign.active === 'Y' ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' : ''}>
                        {campaign.active === 'Y' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={campaign.active === 'Y'}
                        onCheckedChange={() => toggleCampaign(campaign.campaign_id, campaign.active)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Live Agents */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle>Live Agents</CardTitle>
            <CardDescription>Real-time agent status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-glass-border hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No agents currently online
                    </TableCell>
                  </TableRow>
                ) : (
                  liveAgents.map((agent) => (
                    <TableRow key={agent.user} className="border-glass-border hover:bg-glass-light/50">
                      <TableCell className="font-medium">{agent.user}</TableCell>
                      <TableCell>{agent.campaign_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getAgentStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(agent.last_state_change).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
