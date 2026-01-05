import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/components/ui/theme-provider';
import { Shield, Settings as SettingsIcon, Monitor, Info, Lock, Moon, Sun, Server, Activity, Globe } from 'lucide-react';
import { auth, usersService, settingsService } from '@/services';
import { toast } from 'sonner';
import axios from 'axios';

interface SystemStatus {
  status: string;
  timestamp: string;
  uptime: number;
  memory: any;
  version: string;
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // IP Whitelist State
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [allowedIps, setAllowedIps] = useState('');
  const [savingIpSettings, setSavingIpSettings] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
    fetchIpWhitelistConfig();
  }, []);

  const fetchIpWhitelistConfig = async () => {
    try {
      const config = await settingsService.getIpWhitelistConfig();
      setIpWhitelistEnabled(config.enabled);
      setAllowedIps(config.allowedIps.join('\n'));
    } catch (error) {
      console.error('Failed to fetch IP whitelist config:', error);
      // Don't show error toast on load as user might not have permission
    }
  };

  const handleSaveIpSettings = async () => {
    setSavingIpSettings(true);
    try {
      const ips = allowedIps.split('\n').map(ip => ip.trim()).filter(ip => ip !== '');
      await settingsService.updateIpWhitelistConfig({
        enabled: ipWhitelistEnabled,
        allowedIps: ips
      });
      toast.success("IP Whitelist settings saved successfully");
    } catch (error) {
      console.error('Failed to save IP whitelist settings:', error);
      toast.error("Failed to save IP whitelist settings");
    } finally {
      setSavingIpSettings(false);
    }
  };

  const fetchSystemStatus = async () => {
    setLoadingStatus(true);
    try {
      // Direct axios call to avoid service wrapper if not exists
      const response = await axios.get('/api/status');
      setSystemStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      // Fallback mock if API fails (e.g. during dev)
      setSystemStatus({
        status: 'unknown',
        timestamp: new Date().toISOString(),
        uptime: 0,
        memory: {},
        version: '1.0.0'
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        toast.error("User not found");
        return;
      }

      // Note: The backend currently allows admins to update passwords directly without current password check
      // In a real app, you'd want a specific endpoint for "change password" that verifies the old one.
      // For now, we'll use the updateUser endpoint.
      
      await usersService.updateUser(currentUser.id, {
        password: newPassword
      });

      toast.success("Password updated successfully");
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error("Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>
                Current status and version information of the CRM system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">System Status</Label>
                  <div className="flex items-center gap-2">
                    <Activity className={`h-4 w-4 ${systemStatus?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="font-medium capitalize">{systemStatus?.status || 'Checking...'}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Version</Label>
                  <div className="font-medium">{systemStatus?.version || '1.0.0'}</div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Uptime</Label>
                  <div className="font-medium">{systemStatus ? formatUptime(systemStatus.uptime) : '-'}</div>
                </div>

                <div className="space-y-1">
                  <Label className="text-muted-foreground">Last Checked</Label>
                  <div className="font-medium">{systemStatus ? new Date(systemStatus.timestamp).toLocaleString() : '-'}</div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="outline" onClick={fetchSystemStatus} disabled={loadingStatus}>
                  {loadingStatus ? 'Refreshing...' : 'Refresh Status'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                IP Whitelisting
              </CardTitle>
              <CardDescription>
                Restrict access to the CRM to specific IP addresses.
                <br />
                <span className="text-yellow-500 font-medium">Warning: Ensure your current IP is included to avoid locking yourself out.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="ip-whitelist-mode" className="flex flex-col space-y-1">
                  <span>Enable IP Whitelisting</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Only allow connections from listed IP addresses
                  </span>
                </Label>
                <Switch
                  id="ip-whitelist-mode"
                  checked={ipWhitelistEnabled}
                  onCheckedChange={setIpWhitelistEnabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="allowed-ips">Allowed IP Addresses (One per line)</Label>
                <Textarea
                  id="allowed-ips"
                  placeholder="192.168.1.100&#10;203.0.113.50"
                  value={allowedIps}
                  onChange={(e) => setAllowedIps(e.target.value)}
                  rows={5}
                  className="font-mono"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveIpSettings} disabled={savingIpSettings}>
                  {savingIpSettings ? 'Saving...' : 'Save IP Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Theme Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred display mode
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-secondary p-1 rounded-lg">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="gap-2"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="gap-2"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'ghost'} 
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
