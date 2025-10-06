import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Phone, CheckCircle, AlertTriangle, Settings, Save, TestTube } from "lucide-react"
import { useForm } from "react-hook-form"
import { useState } from "react"

export default function ThreeCXStatus() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  
  const form = useForm({
    defaultValues: {
      serverUrl: "https://your-3cx-server.com",
      apiKey: "",
      username: "",
      password: "",
      autoSync: true,
      callLogging: true,
      popupOnCall: true,
      recordCalls: false,
      dialerMode: "preview",
      notes: ""
    }
  })

  const onSubmit = (data: any) => {
    console.log("3CX Configuration:", data)
    setIsConfigOpen(false)
  }

  const testConnection = () => {
    console.log("Testing 3CX connection...")
  }
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      <div className="glass-card p-6 border-glass-border">
        <h1 className="text-3xl font-bold font-poppins text-foreground mb-2">
          3CX Integration Status
        </h1>
        <p className="text-muted-foreground">Monitor 3CX phone system integration</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-accent" />
              <span>Connection Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Server Connection</span>
              <Badge className="bg-success/10 text-success border-success/20">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>API Status</span>
              <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
            </div>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-accent hover:shadow-accent">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Integration
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dialog max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-accent" />
                    3CX Integration Configuration
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Server Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Server Settings</h3>
                      
                      <FormField
                        control={form.control}
                        name="serverUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>3CX Server URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://your-3cx-server.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="admin" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="apiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your 3CX API key" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Integration Features */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Integration Features</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="autoSync"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-glass-border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Auto Sync Accounts</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Automatically sync accounts to 3CX
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="callLogging"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-glass-border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Call Logging</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Auto-log calls in CRM
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="popupOnCall"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-glass-border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Popup on Call</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Show customer info during calls
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="recordCalls"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-glass-border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Record Calls</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Attach recordings to accounts
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Dialer Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Dialer Settings</h3>
                      
                      <FormField
                        control={form.control}
                        name="dialerMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dialer Mode</FormLabel>
                            <FormControl>
                              <select 
                                {...field} 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                <option value="preview">Preview Dialer</option>
                                <option value="progressive">Progressive Dialer</option>
                                <option value="predictive">Predictive Dialer</option>
                                <option value="manual">Manual Dialer</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Configuration Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add any configuration notes or special instructions..."
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={testConnection}
                        className="flex-1"
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Connection
                      </Button>
                      <Button type="submit" className="flex-1 bg-gradient-accent hover:shadow-accent">
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Call Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Lines</span>
              <span className="font-mono font-bold">12/20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Queue Length</span>
              <span className="font-mono font-bold">3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}