import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Shield, Bell, Phone, Mail } from "lucide-react"

export default function SystemSettings() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      <div className="glass-card p-6 border-glass-border">
        <h1 className="text-3xl font-bold font-poppins text-foreground mb-2">
          System Settings
        </h1>
        <p className="text-muted-foreground">Configure system preferences and security settings</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-accent" />
              <span>Database Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Auto Backup</span>
              <Switch defaultChecked className="data-[state=checked]:bg-accent" />
            </div>
            <div className="flex items-center justify-between">
              <span>Data Encryption</span>
              <Badge className="bg-success/10 text-success">AES-256 Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-accent" />
              <span>3CX Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="3CX Server URL" className="glass-light border-glass-border" />
            <Button className="w-full bg-gradient-accent hover:shadow-accent">Test Connection</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}