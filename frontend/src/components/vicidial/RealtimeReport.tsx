import { useState, useEffect } from 'react';
import { vicidialService, RealtimeReport as RealtimeReportType } from '@/services/vicidial';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Phone, Users, Activity } from 'lucide-react';

export function RealtimeReport() {
  const [data, setData] = useState<RealtimeReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const report = await vicidialService.getRealtimeReport();
      setData(report);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch realtime report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-500 hover:bg-green-600';
      case 'INCALL': return 'bg-red-500 hover:bg-red-600';
      case 'PAUSED': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'QUEUE': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const formatDuration = (dateString: string) => {
    const start = new Date(dateString).getTime();
    const now = new Date().getTime();
    // Adjust for timezone if needed, but assuming server time is synced or relative
    // If dateString is UTC and local is not, this might be off. 
    // VICIdial usually stores local server time.
    
    // Simple diff
    let diff = Math.floor((now - start) / 1000);
    if (diff < 0) diff = 0; // Prevent negative if clocks slightly off
    
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading && !data) return <div className="p-4 text-center">Loading realtime stats...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Real-time Report</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats.reduce((acc, curr) => acc + curr.calls_today, 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.agents.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Waiting</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.calls.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drop Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats.length && data.stats.reduce((acc, curr) => acc + curr.calls_today, 0) > 0 ? 
                (data.stats.reduce((acc, curr) => acc + curr.drops_today, 0) / 
                 data.stats.reduce((acc, curr) => acc + curr.calls_today, 0) * 100).toFixed(2) + '%' 
                : '0%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Agents Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Live Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time in Status</TableHead>
                <TableHead>Calls Today</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.agents.map((agent) => (
                <TableRow key={agent.user}>
                  <TableCell className="font-medium">
                    {agent.full_name} <span className="text-xs text-muted-foreground">({agent.user})</span>
                  </TableCell>
                  <TableCell>{agent.campaign_id}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatDuration(agent.last_state_change)}
                  </TableCell>
                  <TableCell>{agent.calls_today}</TableCell>
                </TableRow>
              ))}
              {data?.agents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-4">No agents logged in</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Waiting Calls Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Calls in Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Wait Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.calls.map((call, idx) => (
                <TableRow key={idx}>
                  <TableCell>{call.phone_number}</TableCell>
                  <TableCell>{call.campaign_id}</TableCell>
                  <TableCell className="font-mono">{formatDuration(call.call_time)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{call.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {data?.calls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No calls waiting</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
