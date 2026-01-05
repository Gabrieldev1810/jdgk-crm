import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Phone, User, DollarSign, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Account } from '@/types/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CurrentCallCardProps {
    status: 'PAUSED' | 'READY' | 'INCALL';
    callInfo: { leadId: number; campaignId: string; comments?: string; phoneNumber?: string } | null;
    activeAccount: Account | null;
    loading?: boolean;
    onStatusChange?: (status: 'PAUSED' | 'READY') => void;
    showControls?: boolean;
}

export function CurrentCallCard({
    status,
    callInfo,
    activeAccount,
    loading = false,
    onStatusChange,
    showControls = false
}: CurrentCallCardProps) {
    const navigate = useNavigate();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (status !== 'INCALL' && !showControls) {
        return null;
    }

    return (
        <Card className={`border-l-4 ${status === 'INCALL' ? 'border-l-red-500' : 'border-l-gray-300'} mb-6 shadow-md`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {status === 'INCALL' ? (
                                <>
                                    <Phone className="h-5 w-5 text-red-500 animate-pulse" />
                                    Active Call
                                </>
                            ) : (
                                "Agent Status"
                            )}
                        </CardTitle>
                        <CardDescription>
                            {status === 'INCALL'
                                ? `Connected to ${callInfo?.phoneNumber || 'Unknown Number'}`
                                : `Current Status: ${status}`
                            }
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'INCALL' && (
                            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                        )}
                        {showControls && onStatusChange && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={status === 'READY' ? "secondary" : "default"}
                                    onClick={() => onStatusChange('READY')}
                                    disabled={loading || status === 'INCALL' || status === 'READY'}
                                    className={status !== 'READY' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <Play className="h-3 w-3 mr-1" /> Ready
                                </Button>
                                <Button
                                    size="sm"
                                    variant={status === 'PAUSED' ? "secondary" : "destructive"}
                                    onClick={() => onStatusChange('PAUSED')}
                                    disabled={loading || status === 'INCALL' || status === 'PAUSED'}
                                >
                                    <Pause className="h-3 w-3 mr-1" /> Pause
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {status === 'INCALL' ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {activeAccount ? (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold flex items-center gap-2">
                                            {activeAccount.fullName}
                                            <Badge variant="outline">{activeAccount.accountNumber}</Badge>
                                        </h3>
                                        {activeAccount.address1 && (
                                            <div className="flex items-center text-muted-foreground text-sm">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {activeAccount.address1}, {activeAccount.city}
                                            </div>
                                        )}
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/accounts/${activeAccount.id}`)}>
                                        <User className="h-4 w-4 mr-2" />
                                        Full Profile
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Current Balance</p>
                                        <p className="text-2xl font-bold text-primary">{formatCurrency(activeAccount.currentBalance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant={activeAccount.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {activeAccount.status}
                                            </Badge>
                                            {activeAccount.secondaryStatus && (
                                                <span className="text-xs text-muted-foreground">
                                                    {activeAccount.secondaryStatus}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 border rounded-lg border-dashed text-center">
                                <User className="h-8 w-8 text-muted-foreground mb-2" />
                                <h3 className="text-lg font-medium">No Account Found</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    No CRM account linked to {callInfo?.phoneNumber}
                                </p>
                                <Button onClick={() => navigate('/accounts/new')}>Create New Account</Button>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">Call Details</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 p-2 bg-background border rounded">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-mono">{callInfo?.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-background border rounded">
                                        <span className="text-muted-foreground">Lead ID:</span>
                                        <span className="font-mono">{callInfo?.leadId}</span>
                                    </div>
                                </div>
                            </div>
                            {callInfo?.comments && (
                                <div className="p-3 bg-yellow-50/50 border border-yellow-100 rounded-md text-sm">
                                    <span className="font-semibold text-yellow-800">Comments: </span>
                                    <span className="text-yellow-700">{callInfo.comments}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        {status === 'PAUSED' ? 'You are paused. Click "Ready" to start receiving calls.' : 'Waiting for incoming call...'}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
