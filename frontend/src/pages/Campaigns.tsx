import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vicidialService, UpdateDialingSettingsDto } from '@/services/vicidial';
import { accountService } from '@/services/accounts'; // Import accountService
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Loader2, RefreshCw } from 'lucide-react'; // Added RefreshCw

// New Sync Dialog Component
const SyncLeadsDialog = ({ campaignId, open, onOpenChange }: { campaignId: string; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number, failed: number } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      // 1. Fetch recent accounts from CRM (Limit 50 for demo)
      const accountsRes = await accountService.getAccounts({ limit: 50 });
      const accounts = accountsRes.data;

      if (accounts.length === 0) {
        toast({ title: 'No Accounts', description: 'No CRM accounts found to sync.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // 2. Map to VICIdial structure
      // Assuming campaignId is comparable to listId or we use a default
      // For this demo, we use a mapping or ask user. We'll default to '9999' as per backend test.
      const listId = campaignId.replace(/\D/g, '') || '9999'; // Extract numbers or default

      const leads = accounts.map(acc => ({
        vendor_lead_code: acc.accountNumber,
        phone_number: acc.phoneNumber || '0000000000',
        first_name: acc.firstName,
        last_name: acc.lastName,
        email: acc.email,
        city: acc.city,
        state: acc.state,
        postal_code: acc.postalCode,
        status: 'NEW'
      }));

      // 3. Sync to VICIdial
      const res = await vicidialService.syncLeads(leads, listId);

      if (res.failed > 0) {
        console.error('Sync Errors:', res.errors);
        toast({ title: 'Sync Completed with Errors', description: `Synced: ${res.created}, Failed: ${res.failed}. Check console for details.`, variant: "destructive" });
      } else {
        toast({ title: 'Sync Successful', description: `Successfully synced ${res.created} leads to List ${listId}.` });
      }
      setSyncResult({ created: res.created, failed: res.failed });

    } catch (error: any) {
      console.error('Sync failed', error);
      toast({ title: 'Sync Failed', description: error.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync CRM Leads to Campaign {campaignId}</DialogTitle>
          <DialogDescription>
            This will fetch up to 50 recent accounts from the CRM and push them to the VICIdial List associated with this campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {syncResult ? (
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-green-600">Sync Complete!</p>
              <p>Created/Updated: {syncResult.created}</p>
              <p>Failed: {syncResult.failed}</p>
              <Button onClick={() => setSyncResult(null)} variant="outline" size="sm">Reset</Button>
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Ready to sync accounts to Dialer.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSync} disabled={loading || !!syncResult}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DialingSettingsDialog = ({ campaignId, open, onOpenChange }: { campaignId: string; open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<UpdateDialingSettingsDto>({});

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['campaign-settings', campaignId],
    queryFn: () => vicidialService.getCampaignDialingSettings(campaignId),
    enabled: open,
  });

  useEffect(() => {
    if (currentSettings) {
      setSettings({
        dialMethod: currentSettings.dial_method,
        autoDialLevel: currentSettings.auto_dial_level,
        availableOnlyRatioTally: currentSettings.available_only_ratio_tally === 'Y',
        adaptIntensityModifier: currentSettings.adapt_intensity_modifier,
      });
    }
  }, [currentSettings]);

  const mutation = useMutation({
    mutationFn: (data: UpdateDialingSettingsDto) => vicidialService.updateCampaignDialingSettings(campaignId, data),
    onSuccess: () => {
      toast({ title: 'Settings updated', description: 'Campaign dialing settings have been saved.' });
      queryClient.invalidateQueries({ queryKey: ['campaign-settings', campaignId] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update settings.', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    mutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dialing Settings - {campaignId}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dialMethod" className="text-right">Dial Method</Label>
            <Select
              value={settings.dialMethod}
              onValueChange={(val: any) => setSettings({ ...settings, dialMethod: val })}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="RATIO">Ratio</SelectItem>
                <SelectItem value="ADAPT_HARD_LIMIT">Adapt Hard Limit</SelectItem>
                <SelectItem value="ADAPT_TAPERED">Adapt Tapered</SelectItem>
                <SelectItem value="ADAPT_AVERAGE">Adapt Average</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="autoDialLevel" className="text-right">Auto Dial Level</Label>
            <Input
              id="autoDialLevel"
              type="number"
              className="col-span-3"
              value={settings.autoDialLevel || 0}
              onChange={(e) => setSettings({ ...settings, autoDialLevel: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="adaptIntensity" className="text-right">Adapt Intensity</Label>
            <Input
              id="adaptIntensity"
              type="number"
              className="col-span-3"
              value={settings.adaptIntensityModifier || 0}
              onChange={(e) => setSettings({ ...settings, adaptIntensityModifier: parseFloat(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ratioTally" className="text-right">Avail Only Tally</Label>
            <div className="col-span-3 flex items-center space-x-2">
              <Switch
                id="ratioTally"
                checked={settings.availableOnlyRatioTally}
                onCheckedChange={(checked) => setSettings({ ...settings, availableOnlyRatioTally: checked })}
              />
              <Label htmlFor="ratioTally">{settings.availableOnlyRatioTally ? 'Yes' : 'No'}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Campaigns() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: vicidialService.getCampaigns,
  });

  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [syncCampaign, setSyncCampaign] = useState<string | null>(null); // New state for Sync Dialog

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              )}
              {campaigns?.map((campaign) => (
                <TableRow key={campaign.campaign_id}>
                  <TableCell className="font-medium">{campaign.campaign_id}</TableCell>
                  <TableCell>{campaign.campaign_name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${campaign.active === 'Y' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {campaign.active === 'Y' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => setSyncCampaign(campaign.campaign_id)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Leads
                    </Button>
                    <Button variant="default" size="sm" onClick={() => setSelectedCampaign(campaign.campaign_id)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedCampaign && (
        <DialingSettingsDialog
          campaignId={selectedCampaign}
          open={!!selectedCampaign}
          onOpenChange={(open) => !open && setSelectedCampaign(null)}
        />
      )}

      {syncCampaign && (
        <SyncLeadsDialog
          campaignId={syncCampaign}
          open={!!syncCampaign}
          onOpenChange={(open) => !open && setSyncCampaign(null)}
        />
      )}
    </div>
  );
}
