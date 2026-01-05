import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Play, Pause, Phone } from 'lucide-react';
import { CurrentCallCard } from '@/components/vicidial/CurrentCallCard';
import { useAgentStatus } from '@/hooks/useAgentStatus';

export default function AgentWorkstation() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const {
        agentId,
        status,
        loading,
        callInfo,
        activeAccount,
        accountLoading,
        updateStatus
    } = useAgentStatus();

    // Stats mock (could be fetched)
    const stats = {
        callsToday: 42,
        talkTime: '3h 15m',
        avgDuration: '4m 30s',
        conversionRate: '12%'
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Agent Workstation</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground mr-2">Agent ID: {agentId || 'Loading...'}</span>
                    <Badge variant={status === 'READY' ? 'default' : status === 'INCALL' ? 'destructive' : 'secondary'}
                        className={`text-lg px-4 py-1 
                     ${status === 'READY' ? 'bg-green-600 hover:bg-green-700' : ''}
                     ${status === 'INCALL' ? 'bg-red-600 hover:bg-red-700' : ''}
                   `}>
                        {status}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                {/* Control Panel */}
                <Card className="md:col-span-4 h-fit">
                    <CardHeader>
                        <CardTitle>Status Control</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <Button
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => updateStatus('READY')}
                            disabled={status === 'READY' || status === 'INCALL' || loading || !agentId}
                        >
                            <Play className="mr-2 h-5 w-5" />
                            Start Dialing
                        </Button>
                        <Button
                            size="lg"
                            variant="destructive"
                            className="w-full"
                            onClick={() => updateStatus('PAUSED')}
                            disabled={status === 'PAUSED' || status === 'INCALL' || loading || !agentId}
                        >
                            <Pause className="mr-2 h-5 w-5" />
                            Pause
                        </Button>
                    </CardContent>
                </Card>

                {/* Active Call / Account Info */}
                <div className="md:col-span-8 space-y-6">
                    <CurrentCallCard
                        status={status}
                        callInfo={callInfo}
                        activeAccount={activeAccount}
                        loading={accountLoading}
                        onStatusChange={updateStatus}
                        showControls={false} // Already shown in side panel
                    />

                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Stats</CardTitle>
                            <CardDescription>Performance for current session</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Calls Today</p>
                                    <p className="text-2xl font-bold">{stats.callsToday}</p>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Talk Time</p>
                                    <p className="text-2xl font-bold">{stats.talkTime}</p>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                                    <p className="text-2xl font-bold">{stats.avgDuration}</p>
                                </div>
                                <div className="text-center p-4 bg-muted/50 rounded-lg">
                                    <p className="text-sm font-medium text-muted-foreground">Conversion</p>
                                    <p className="text-2xl font-bold">{stats.conversionRate}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Callbacks / Tasks placeholer */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold">Scheduled Callbacks</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/accounts?filter=callbacks')}>View All</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-center py-6 text-muted-foreground">
                                No callbacks scheduled for the next hour.
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
