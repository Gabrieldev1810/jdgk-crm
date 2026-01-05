import { useState, useEffect } from 'react';
import { vicidialService } from '@/services/vicidial';
import { auth } from '@/services/auth';
import { accountService } from '@/services/accounts';
import { Account } from '@/types/api';
import { useToast } from '@/components/ui/use-toast';

export function useAgentStatus() {
    const { toast } = useToast();
    const [status, setStatus] = useState<'PAUSED' | 'READY' | 'INCALL'>('PAUSED');
    const [loading, setLoading] = useState(false);
    const [agentId, setAgentId] = useState<string>('');
    const [callInfo, setCallInfo] = useState<{ leadId: number; campaignId: string; comments?: string; phoneNumber?: string } | null>(null);
    const [activeAccount, setActiveAccount] = useState<Account | null>(null);
    const [accountLoading, setAccountLoading] = useState(false);

    useEffect(() => {
        const user = auth.getUser();
        if (user) {
            const u = user as any;
            if (u.vicidialUserId) {
                setAgentId(u.vicidialUserId);
            } else {
                setAgentId('1000'); // Fallback
            }
        }
    }, []);

    const updateStatus = async (newStatus: 'PAUSED' | 'READY') => {
        if (!agentId) return;
        setLoading(true);
        try {
            const pause = newStatus === 'PAUSED';
            await vicidialService.updateAgentStatus(agentId, pause);
            setStatus(newStatus);
            toast({
                title: pause ? "Paused" : "Ready",
                description: pause ? "You are now paused." : "You are now ready for calls.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to update status.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Poll for status
    useEffect(() => {
        if (!agentId) return;

        const pollStatus = async () => {
            try {
                const report = await vicidialService.getRealtimeReport();
                const myAgent = report.agents?.find(a => a.user === agentId);

                if (myAgent) {
                    let newStatus: 'PAUSED' | 'READY' | 'INCALL' = 'PAUSED';
                    if (myAgent.status === 'PAUSED') {
                        newStatus = 'PAUSED';
                    } else if (['READY', 'CLOSER', 'QUEUE', 'MQUEUE'].includes(myAgent.status)) {
                        newStatus = 'READY';
                    } else if (['INCALL', 'LIVE', 'XFER'].includes(myAgent.status)) {
                        newStatus = 'INCALL';
                    }
                    setStatus(newStatus);

                    if (['INCALL', 'LIVE', 'XFER'].includes(myAgent.status) && myAgent.lead_id) {
                        if (callInfo?.leadId !== myAgent.lead_id) {
                            setCallInfo({
                                leadId: myAgent.lead_id,
                                campaignId: myAgent.campaign_id,
                                comments: myAgent.comments,
                                phoneNumber: myAgent.phone_number
                            });
                        }
                    } else {
                        if (callInfo !== null) setCallInfo(null);
                    }
                }
            } catch (error) {
                // silent
            }
        };

        pollStatus();
        const interval = setInterval(pollStatus, 3000);
        return () => clearInterval(interval);
    }, [agentId, callInfo?.leadId]);

    // Fetch account when call info changes
    useEffect(() => {
        if (callInfo?.phoneNumber) {
            const fetchAccount = async () => {
                setAccountLoading(true);
                try {
                    const response = await accountService.getAccounts({
                        phoneNumbers: [callInfo.phoneNumber!],
                        limit: 1
                    });
                    if (response.data && response.data.length > 0) {
                        setActiveAccount(response.data[0]);
                    } else {
                        setActiveAccount(null);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setAccountLoading(false);
                }
            };

            if (!activeAccount || !activeAccount.phoneNumbers.some(p => p.phoneNumber === callInfo.phoneNumber)) {
                fetchAccount();
            }
        } else if (!callInfo) {
            setActiveAccount(null);
        }
    }, [callInfo?.phoneNumber]);

    return {
        agentId,
        status,
        loading,
        callInfo,
        activeAccount,
        accountLoading,
        updateStatus
    };
}
