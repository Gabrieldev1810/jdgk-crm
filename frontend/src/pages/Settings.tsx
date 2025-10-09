import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Database, Shield, Settings as SettingsIcon, Users, Phone, Mail, CreditCard, Plus, Trash2, Pencil, Calendar, Zap, BarChart3, Workflow, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  routingNumber: string;
  isDefault: boolean;
  type: 'bank' | 'creditor';
  contactInfo?: string;
  interestRate?: number;
}

interface DispositionCategory {
  id: string;
  name: string;
  color: string;
  description: string;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
  autoActions?: string[];
}

interface DashboardCard {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'list' | 'analytics';
  isVisible: boolean;
  order: number;
  config: {
    dataSource: string;
    refreshInterval: number;
    chartType?: string;
    filters?: Record<string, any>;
  };
}

interface PTPSettings {
  id: string;
  defaultAmount: number;
  minAmount: number;
  maxAmount: number;
  allowPartialPayments: boolean;
  requireManagerApproval: boolean;
  reminderSettings: {
    enabled: boolean;
    daysBefore: number;
    method: 'email' | 'sms' | 'both';
  };
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, any>;
  }>;
  isActive: boolean;
}

export default function Settings() {
  const [banks, setBanks] = useState<Bank[]>([
    { id: '1', name: 'Chase Bank', accountNumber: '****1234', routingNumber: '021000021', isDefault: true, type: 'bank' },
    { id: '2', name: 'Wells Fargo', accountNumber: '****5678', routingNumber: '121000248', isDefault: false, type: 'bank' },
    { id: '3', name: 'Capital One Credit', accountNumber: '****9999', routingNumber: '051405515', isDefault: false, type: 'creditor', contactInfo: '1-800-227-4825', interestRate: 24.99 }
  ]);

  const [dispositions, setDispositions] = useState<DispositionCategory[]>([
    { id: '1', name: 'Interested', color: '#22c55e', description: 'Customer showed interest', isActive: true, priority: 'high', autoActions: ['send_follow_up_email'] },
    { id: '2', name: 'Not Interested', color: '#ef4444', description: 'Customer declined', isActive: true, priority: 'low', autoActions: ['remove_from_campaign'] },
    { id: '3', name: 'Callback', color: '#f59e0b', description: 'Schedule follow-up', isActive: true, priority: 'medium', autoActions: ['schedule_callback'] }
  ]);

  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([
    { id: '1', title: 'Total Calls', type: 'metric', isVisible: true, order: 1, config: { dataSource: 'calls', refreshInterval: 300 } },
    { id: '2', title: 'Active Campaigns', type: 'metric', isVisible: true, order: 2, config: { dataSource: 'campaigns', refreshInterval: 600 } },
    { id: '3', title: 'Recent Activity', type: 'list', isVisible: true, order: 3, config: { dataSource: 'activities', refreshInterval: 60 } },
    { id: '4', title: 'Call Analytics', type: 'analytics', isVisible: true, order: 4, config: { dataSource: 'call_analytics', refreshInterval: 900, chartType: 'line' } }
  ]);

  const [ptpSettings, setPtpSettings] = useState<PTPSettings>({
    id: '1',
    defaultAmount: 100,
    minAmount: 25,
    maxAmount: 10000,
    allowPartialPayments: true,
    requireManagerApproval: false,
    reminderSettings: {
      enabled: true,
      daysBefore: 3,
      method: 'email'
    }
  });

  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([
    {
      id: '1',
      name: 'Payment Reminder',
      description: 'Send reminder 3 days before PTP due date',
      trigger: 'ptp_due_soon',
      conditions: [{ field: 'days_until_due', operator: 'equals', value: '3' }],
      actions: [{ type: 'send_email', config: { template: 'payment_reminder' } }],
      isActive: true
    }
  ]);

  const [showNewBankDialog, setShowNewBankDialog] = useState(false);
  const [showNewDispositionDialog, setShowNewDispositionDialog] = useState(false);
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="database" className="w-full">
        <TabsList className="grid w-full grid-cols-7 h-auto">
          <TabsTrigger value="database" className="flex items-center gap-2 p-3">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Database</span>
          </TabsTrigger>
          <TabsTrigger value="banks" className="flex items-center gap-2 p-3">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Banks/Sources</span>
          </TabsTrigger>
          <TabsTrigger value="dispositions" className="flex items-center gap-2 p-3">
            <Badge className="h-4 w-4" />
            <span className="hidden sm:inline">Dispositions</span>
          </TabsTrigger>
          <TabsTrigger value="ptp" className="flex items-center gap-2 p-3">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">PTP</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2 p-3">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 p-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2 p-3">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Workflows</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Settings
              </CardTitle>
              <CardDescription>
                Configure database connections and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">Database Host</Label>
                  <Input id="db-host" placeholder="localhost" defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input id="db-port" type="number" placeholder="5432" defaultValue="5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input id="db-name" placeholder="crm_database" defaultValue="crm_database" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-user">Username</Label>
                  <Input id="db-user" placeholder="admin" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="backup-frequency">Backup Frequency</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retention-days">Data Retention (days)</Label>
                    <Input id="retention-days" type="number" defaultValue="365" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-cleanup old records</Label>
                    <p className="text-sm text-gray-600">Automatically remove old records based on retention policy</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>Test Connection</Button>
                <Button variant="outline">Backup Now</Button>
                <Button variant="outline">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Banks & Financial Sources
              </CardTitle>
              <CardDescription>
                Manage bank accounts and creditor information for payment processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {banks.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bank.name}</span>
                      {bank.isDefault && <Badge variant="default">Default</Badge>}
                      <Badge variant={bank.type === 'bank' ? 'secondary' : 'destructive'}>
                        {bank.type === 'bank' ? 'Bank' : 'Creditor'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Account: {bank.accountNumber} | Routing: {bank.routingNumber}
                    </p>
                    {bank.type === 'creditor' && (
                      <div className="text-sm text-gray-600 mt-1">
                        Contact: {bank.contactInfo} | Rate: {bank.interestRate}%
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Dialog open={showNewBankDialog} onOpenChange={setShowNewBankDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account / Creditor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Financial Source</DialogTitle>
                    <DialogDescription>
                      Add a new bank account or creditor information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select defaultValue="bank">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="creditor">Creditor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">Institution Name</Label>
                      <Input id="bank-name" placeholder="Enter bank or creditor name" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="account-num">Account Number</Label>
                        <Input id="account-num" placeholder="****1234" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="routing-num">Routing Number</Label>
                        <Input id="routing-num" placeholder="021000021" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-info">Contact Information</Label>
                      <Input id="contact-info" placeholder="Phone or email" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="set-default" />
                      <Label htmlFor="set-default">Set as default</Label>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1">Save</Button>
                      <Button variant="outline" onClick={() => setShowNewBankDialog(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dispositions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge className="h-5 w-5" />
                Disposition Categories
              </CardTitle>
              <CardDescription>
                Manage call disposition categories and automated actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dispositions.map((disposition) => (
                <div key={disposition.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: disposition.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{disposition.name}</span>
                        <Badge variant={disposition.priority === 'high' ? 'default' : 
                                      disposition.priority === 'medium' ? 'secondary' : 'outline'}>
                          {disposition.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{disposition.description}</p>
                      {disposition.autoActions && disposition.autoActions.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Auto: {disposition.autoActions.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={disposition.isActive} />
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Dialog open={showNewDispositionDialog} onOpenChange={setShowNewDispositionDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Disposition Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Disposition Category</DialogTitle>
                    <DialogDescription>
                      Add a new call disposition category with automated actions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="disp-name">Category Name *</Label>
                      <Input id="disp-name" placeholder="e.g., Payment Promised" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disp-desc">Description</Label>
                      <Textarea id="disp-desc" placeholder="Describe this disposition category..." />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="disp-color">Color</Label>
                        <Input id="disp-color" type="color" defaultValue="#3b82f6" />
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Automated Actions</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="auto-email" />
                          <Label htmlFor="auto-email">Send follow-up email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="auto-schedule" />
                          <Label htmlFor="auto-schedule">Schedule callback</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="auto-remove" />
                          <Label htmlFor="auto-remove">Remove from campaign</Label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button className="flex-1">Create Category</Button>
                      <Button variant="outline" onClick={() => setShowNewDispositionDialog(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Disposition Categories</CardTitle>
              <CardDescription>
                Manage call disposition categories and outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dispositions.map((disposition) => (
                <div key={disposition.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: disposition.color }}
                    />
                    <div>
                      <span className="font-medium">{disposition.name}</span>
                      <p className="text-sm text-gray-600">{disposition.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={disposition.isActive} />
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Disposition Category
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ptp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Promise (PTP) Setup
              </CardTitle>
              <CardDescription>
                Configure payment promise settings and automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-amount">Default PTP Amount ($)</Label>
                  <Input 
                    id="default-amount" 
                    type="number" 
                    value={ptpSettings.defaultAmount} 
                    onChange={(e) => setPtpSettings({...ptpSettings, defaultAmount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-amount">Minimum Amount ($)</Label>
                  <Input 
                    id="min-amount" 
                    type="number" 
                    value={ptpSettings.minAmount}
                    onChange={(e) => setPtpSettings({...ptpSettings, minAmount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-amount">Maximum Amount ($)</Label>
                  <Input 
                    id="max-amount" 
                    type="number" 
                    value={ptpSettings.maxAmount}
                    onChange={(e) => setPtpSettings({...ptpSettings, maxAmount: Number(e.target.value)})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">PTP Rules & Automation</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Partial Payments</Label>
                    <p className="text-sm text-gray-600">Enable customers to make partial payments toward their PTP</p>
                  </div>
                  <Switch 
                    checked={ptpSettings.allowPartialPayments}
                    onCheckedChange={(checked) => setPtpSettings({...ptpSettings, allowPartialPayments: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Manager Approval</Label>
                    <p className="text-sm text-gray-600">Require manager approval for PTPs over maximum amount</p>
                  </div>
                  <Switch 
                    checked={ptpSettings.requireManagerApproval}
                    onCheckedChange={(checked) => setPtpSettings({...ptpSettings, requireManagerApproval: checked})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Reminder Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Payment Reminders</Label>
                    <p className="text-sm text-gray-600">Send automated reminders before PTP due date</p>
                  </div>
                  <Switch 
                    checked={ptpSettings.reminderSettings.enabled}
                    onCheckedChange={(checked) => setPtpSettings({
                      ...ptpSettings, 
                      reminderSettings: {...ptpSettings.reminderSettings, enabled: checked}
                    })}
                  />
                </div>
                
                {ptpSettings.reminderSettings.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reminder-days">Send Reminder (days before due)</Label>
                      <Input 
                        id="reminder-days" 
                        type="number" 
                        value={ptpSettings.reminderSettings.daysBefore}
                        onChange={(e) => setPtpSettings({
                          ...ptpSettings,
                          reminderSettings: {...ptpSettings.reminderSettings, daysBefore: Number(e.target.value)}
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reminder Method</Label>
                      <Select 
                        value={ptpSettings.reminderSettings.method}
                        onValueChange={(value: 'email' | 'sms' | 'both') => setPtpSettings({
                          ...ptpSettings,
                          reminderSettings: {...ptpSettings.reminderSettings, method: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="both">Email & SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button>Save PTP Settings</Button>
                <Button variant="outline">Test Reminder</Button>
                <Button variant="outline">Reset to Defaults</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                  <Input id="max-login-attempts" type="number" defaultValue="3" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Require 2FA for all users</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password Complexity</Label>
                    <p className="text-sm text-gray-600">Enforce strong password requirements</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Google SMTP Setup
              </CardTitle>
              <CardDescription>
                Configure Google SMTP for automated email notifications and campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Gmail App Password Required</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      To use Gmail SMTP, you need to generate an App Password in your Google Account settings. 
                      Regular Gmail passwords won't work with this integration.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Email Provider</Label>
                  <Select defaultValue="gmail">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Google Gmail</SelectItem>
                      <SelectItem value="outlook">Microsoft Outlook</SelectItem>
                      <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                      <SelectItem value="custom">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-server">SMTP Server</Label>
                  <Input id="smtp-server" defaultValue="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input id="smtp-port" type="number" defaultValue="587" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Gmail Address</Label>
                  <Input id="smtp-username" type="email" placeholder="your-email@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">App Password</Label>
                  <Input id="smtp-password" type="password" placeholder="16-character app password" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="smtp-ssl" defaultChecked />
                  <Label htmlFor="smtp-ssl">Use SSL/TLS (Required for Gmail)</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Sender Name</Label>
                  <Input id="sender-name" placeholder="CRM System" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reply-to">Reply-To Email</Label>
                  <Input id="reply-to" type="email" placeholder="noreply@yourcompany.com" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Email Templates</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Reminder Template</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                        Test
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>PTP Confirmation Template</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                        Test
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Campaign Follow-up Template</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                        Test
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Account Status Update</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>Test Gmail Connection</Button>
                <Button variant="outline">Send Test Email</Button>
                <Button variant="outline">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Vicidial Integration
              </CardTitle>
              <CardDescription>
                Configure connection to Vicidial system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vicidial-url">Vicidial URL</Label>
                  <Input id="vicidial-url" placeholder="http://vicidial.server.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vicidial-port">Port</Label>
                  <Input id="vicidial-port" type="number" placeholder="8080" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vicidial-user">API Username</Label>
                  <Input id="vicidial-user" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vicidial-pass">API Password</Label>
                  <Input id="vicidial-pass" type="password" />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="vicidial-enabled" />
                <Label htmlFor="vicidial-enabled">Enable Vicidial Integration</Label>
              </div>
              
              <div className="flex gap-2">
                <Button>Test Connection</Button>
                <Button variant="outline">Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Default User Role</h3>
                  <p className="text-sm text-gray-600">Role assigned to new users by default</p>
                </div>
                <Select defaultValue="agent">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-approve new users</Label>
                    <p className="text-sm text-gray-600">Automatically approve user registrations</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email verification required</Label>
                    <p className="text-sm text-gray-600">Require email verification for new accounts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard Analytics Configuration
              </CardTitle>
              <CardDescription>
                Customize dashboard cards, analytics, and data visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Analytics Cards</h3>
                {dashboardCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col">
                        <div className="font-medium">{card.title}</div>
                        <div className="text-sm text-gray-600">
                          Source: {card.config.dataSource} • Refresh: {card.config.refreshInterval}s
                          {card.config.chartType && ` • Chart: ${card.config.chartType}`}
                        </div>
                      </div>
                      <Badge variant={card.type === 'analytics' ? 'default' : 'outline'}>
                        {card.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Order: {card.order}</span>
                      <Switch checked={card.isVisible} />
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Analytics Card
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Refresh Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-refresh">Default Refresh Interval</Label>
                    <Select defaultValue="300">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                        <SelectItem value="1800">30 minutes</SelectItem>
                        <SelectItem value="3600">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cache-duration">Cache Duration</Label>
                    <Select defaultValue="900">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                        <SelectItem value="900">15 minutes</SelectItem>
                        <SelectItem value="1800">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-data-points">Max Data Points</Label>
                    <Input id="max-data-points" type="number" defaultValue="100" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Real-time Updates</Label>
                    <p className="text-sm text-gray-600">Enable WebSocket connections for live data updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-refresh Charts</Label>
                    <p className="text-sm text-gray-600">Automatically refresh chart data based on interval settings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Chart Customization</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Chart Theme</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light Theme</SelectItem>
                        <SelectItem value="dark">Dark Theme</SelectItem>
                        <SelectItem value="auto">Auto (System)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Animation Duration (ms)</Label>
                    <Input type="number" defaultValue="750" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Data Labels</Label>
                    <p className="text-sm text-gray-600">Display value labels on chart elements</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Export Options</Label>
                    <p className="text-sm text-gray-600">Enable chart export to PDF, PNG, and Excel formats</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>Save Analytics Settings</Button>
                <Button variant="outline">Reset Layout</Button>
                <Button variant="outline">Export Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Workflow Automation
              </CardTitle>
              <CardDescription>
                Configure automated processes, notifications, and business rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Active Workflows</h3>
                {workflowRules.map((workflow) => (
                  <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{workflow.name}</span>
                        <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                      <div className="text-xs text-blue-600 mt-1">
                        Trigger: {workflow.trigger} • {workflow.conditions.length} condition(s) • {workflow.actions.length} action(s)
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={workflow.isActive} />
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Workflow
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Automated Workflow</DialogTitle>
                      <DialogDescription>
                        Set up automated processes and notifications based on specific triggers and conditions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="workflow-name">Workflow Name</Label>
                          <Input id="workflow-name" placeholder="e.g., Payment Follow-up" />
                        </div>
                        <div className="space-y-2">
                          <Label>Trigger Event</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select trigger..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ptp_created">PTP Created</SelectItem>
                              <SelectItem value="ptp_due_soon">PTP Due Soon</SelectItem>
                              <SelectItem value="call_completed">Call Completed</SelectItem>
                              <SelectItem value="account_updated">Account Updated</SelectItem>
                              <SelectItem value="disposition_changed">Disposition Changed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="workflow-desc">Description</Label>
                        <Textarea id="workflow-desc" placeholder="Describe what this workflow does..." />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Conditions</h4>
                        <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No conditions set. This workflow will trigger for all events.</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Condition
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Actions</h4>
                        <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No actions configured. Add actions to make this workflow functional.</p>
                          <div className="flex gap-2 mt-2 justify-center">
                            <Button variant="outline" size="sm">
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </Button>
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-2" />
                              Create Task
                            </Button>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-2" />
                              Schedule Call
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button className="flex-1">Create Workflow</Button>
                        <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>Cancel</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-600">Send email alerts for workflow events</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-600">Send SMS alerts for urgent workflow events</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>In-App Notifications</Label>
                      <p className="text-sm text-gray-600">Show notifications within the CRM interface</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Notification Recipients</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipients..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned_user">Assigned User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="all">All Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Notification Priority</Label>
                      <Select defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button>Save Workflow Settings</Button>
                <Button variant="outline">Test Notifications</Button>
                <Button variant="outline">Import Workflows</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}