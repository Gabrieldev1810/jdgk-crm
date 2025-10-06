import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" 
import { Button } from "@/components/ui/button"
import { Database, CheckCircle, HardDrive, Shield } from "lucide-react"

export default function DatabaseIntegration() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      <div className="glass-card p-6 border-glass-border">
        <h1 className="text-3xl font-bold font-poppins text-foreground mb-2">
          Database Management
        </h1>
        <p className="text-muted-foreground">Monitor database health and security</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-accent" />
              <span>Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-success/10 text-success border-success/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Healthy
            </Badge>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-accent" />
              <span>Storage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">2.4TB</div>
            <p className="text-xs text-muted-foreground">Available space</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-accent" />
              <span>Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-success/10 text-success border-success/20">
              AES-256 Active
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}