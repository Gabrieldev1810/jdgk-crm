import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, 
  Search, 
  Shield, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Trash2,
  Plus,
  Settings,
  Key,
  Loader2
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { rbacService } from "@/services/rbac"
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  createdAt: string
  action: string
  entity: string
  entityId?: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  metadata?: string
  actor?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

const actionIcons = {
  "Created Role": Plus,
  "Updated Role": Edit,
  "Deleted Role": Trash2,
  "Created Permission": Key,
  "Updated Permissions": Settings,
  "Assigned Role": UserPlus,
  "Removed Role": UserMinus,
  "Attempted Privilege Escalation": Shield,
  "Failed Role Assignment": Shield,
  "Permission Cache Invalidated": Settings,
}

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadAuditLogs()
  }, [])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const logs = await rbacService.getAuditLogs()
      setAuditLogs(logs || [])
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast({
        title: "Error loading audit logs",
        description: "Failed to fetch audit logs from server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredLogs = auditLogs.filter(log => {
    const actorName = log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'
    const matchesSearch = 
      actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.newValue && log.newValue.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = filterType === "all" || log.entity === filterType

    return matchesSearch && matchesType
  })

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action as keyof typeof actionIcons] || FileText
    return Icon
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">RBAC Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Complete audit trail of all role and permission changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Security Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {auditLogs.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Actions</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {auditLogs.filter(l => l.action.includes("CREATE") || l.action.includes("UPDATE")).length}
              </div>
              <div className="text-sm text-muted-foreground">Modifications</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {new Set(auditLogs.map(l => l.actor?.email || 'System')).size}
              </div>
              <div className="text-sm text-muted-foreground">Unique Actors</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {auditLogs.filter(l => l.action.includes("ESCALATION") || l.action.includes("ADMIN")).length}
              </div>
              <div className="text-sm text-muted-foreground">Security Events</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="role">Roles</SelectItem>
                <SelectItem value="permission">Permissions</SelectItem>
                <SelectItem value="user_role">User Roles</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading audit logs...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No audit logs found</p>
                  {auditLogs.length === 0 && (
                    <p className="text-sm mt-1">Try performing some actions to generate audit logs</p>
                  )}
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const Icon = getActionIcon(log.action)
                  const actorName = log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'
                  const formattedDate = new Date(log.createdAt).toLocaleString()
                  
                  return (
                    <Card key={log.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold">{log.action}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {log.entity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium">{actorName}</span> → {log.entity}
                                  {log.entityId && (
                                    <span className="text-xs ml-1">({log.entityId.slice(0, 8)}...)</span>
                                  )}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formattedDate}
                              </span>
                            </div>

                            {log.newValue && (
                              <p className="text-sm bg-muted/50 p-2 rounded text-muted-foreground">
                                {JSON.parse(log.newValue || '{}').message || 'Action completed'}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                              {log.sessionId && <span>Session: {log.sessionId.slice(0, 8)}...</span>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
