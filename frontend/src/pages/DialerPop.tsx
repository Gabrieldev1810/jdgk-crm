import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, User, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/services/api';
import { Account, PaginatedResponse } from '@/types/api';

export default function DialerPop() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const handlePop = async () => {
      const phone = searchParams.get('phone');
      const leadId = searchParams.get('lead_id');
      const campaignId = searchParams.get('campaign_id');
      const agentUser = searchParams.get('agent_user');

      if (!phone) {
        setStatus('Error: No phone number provided.');
        return;
      }

      setStatus(`Searching for lead: ${phone}...`);

      try {
        // 1. Search for the lead in our CRM
        // We'll assume an endpoint /accounts/search?phone=... exists or similar
        // For now, we'll use the existing accounts list and filter (not efficient but works for MVP)
        // Better: Implement a specific lookup endpoint.
        
        // Let's try to find by phone number
        const response = await api.get<PaginatedResponse<Account>>(`/accounts?search=${phone}`);
        const accounts = response.data;
        
        if (accounts && accounts.length > 0) {
          const account = accounts[0];
          setStatus('Lead found! Redirecting...');
          toast({
            title: "Incoming Call",
            description: `Found account for ${account.firstName} ${account.lastName}`,
          });
          
          // Redirect to the account details or Kanban card
          // Assuming we have a route /accounts/:id
          setTimeout(() => {
            navigate(`/accounts?id=${account.id}`); // Or open a modal
          }, 1000);
        } else {
          setStatus('New Lead. Redirecting to creation...');
          toast({
            title: "New Lead",
            description: `No account found for ${phone}. Creating new entry.`,
          });
          
          // Redirect to create new account with pre-filled data
          // We can pass state to the route
          setTimeout(() => {
            navigate('/accounts', { 
              state: { 
                createNew: true, 
                prefill: { 
                  phone, 
                  vicidialLeadId: leadId,
                  campaignId 
                } 
              } 
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Error handling dialer pop:', error);
        setStatus('Error processing request.');
        toast({
          title: "Error",
          description: "Failed to process incoming call data.",
          variant: "destructive"
        });
      }
    };

    handlePop();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-500" />
            Incoming Call
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">{status}</p>
            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2 text-left bg-gray-50 p-4 rounded-md">
              <span className="font-semibold">Phone:</span>
              <span>{searchParams.get('phone') || 'N/A'}</span>
              
              <span className="font-semibold">Lead ID:</span>
              <span>{searchParams.get('lead_id') || 'N/A'}</span>
              
              <span className="font-semibold">Campaign:</span>
              <span>{searchParams.get('campaign_id') || 'N/A'}</span>
              
              <span className="font-semibold">Agent:</span>
              <span>{searchParams.get('agent_user') || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
