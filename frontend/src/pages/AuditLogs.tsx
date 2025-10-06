import { useState } from "react"
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
  Key
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AuditLog {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  resourceType: "role" | "permission" | "user_role" | "settings"
  details: string
  ipAddress: string
  status: "success" | "failed"
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    timestamp: "2024-03-15 14:23:45",
    actor: "admin@jdgk.com",
    action: "Created Role",
    resource: "Team Lead",
    resourceType: "role",
    details: "Created new role with 8 permissions",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "2",
    timestamp: "2024-03-15 14:20:12",
    actor: "admin@jdgk.com",
    action: "Updated Permissions",
    resource: "Agent",
    resourceType: "role",
    details: "Added 'accounts.edit' permission",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "3",
    timestamp: "2024-03-15 13:45:30",
    actor: "manager@jdgk.com",
    action: "Assigned Role",
    resource: "juan.delacruz@jdgk.com",
    resourceType: "user_role",
    details: "Assigned 'Agent' role to user",
    ipAddress: "192.168.1.105",
    status: "success"
  },
  {
    id: "4",
    timestamp: "2024-03-15 13:30:18",
    actor: "manager@jdgk.com",
    action: "Attempted Privilege Escalation",
    resource: "Super Admin",
    resourceType: "role",
    details: "Tried to assign Super Admin role - BLOCKED",
    ipAddress: "192.168.1.105",
    status: "failed"
  },
  {
    id: "5",
    timestamp: "2024-03-15 11:15:22",
    actor: "admin@jdgk.com",
    action: "Removed Role",
    resource: "maria.santos@jdgk.com",
    resourceType: "user_role",
    details: "Revoked 'Manager' role from user",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "6",
    timestamp: "2024-03-15 10:45:55",
    actor: "admin@jdgk.com",
    action: "Deleted Role",
    resource: "Temporary Access",
    resourceType: "role",
    details: "Deleted role with 3 permissions",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "7",
    timestamp: "2024-03-15 10:12:08",
    actor: "admin@jdgk.com",
    action: "Created Permission",
    resource: "reports.advanced",
    resourceType: "permission",
    details: "Created new permission for advanced reporting",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "8",
    timestamp: "2024-03-15 09:30:40",
    actor: "system",
    action: "Permission Cache Invalidated",
    resource: "All Users",
    resourceType: "settings",
    details: "Cleared permission cache after role update",
    ipAddress: "127.0.0.1",
    status: "success"
  },
  {
    id: "9",
    timestamp: "2024-03-14 16:55:33",
    actor: "admin@jdgk.com",
    action: "Updated Role",
    resource: "Viewer",
    resourceType: "role",
    details: "Modified role description and permissions",
    ipAddress: "192.168.1.100",
    status: "success"
  },
  {
    id: "10",
    timestamp: "2024-03-14 15:20:15",
    actor: "manager@jdgk.com",
    action: "Failed Role Assignment",
    resource: "pedro.reyes@jdgk.com",
    resourceType: "user_role",
    details: "Insufficient permissions to assign role",
    ipAddress: "192.168.1.105",
    status: "failed"
  },
]

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
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === "all" || log.resourceType === filterType
    const matchesStatus = filterStatus === "all" || log.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
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
              {filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action)
                return (
                  <Card key={log.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          log.status === "failed" 
                            ? "bg-destructive/10" 
                            : "bg-primary/10"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            log.status === "failed" 
                              ? "text-destructive" 
                              : "text-primary"
                          }`} />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{log.action}</h3>
                                <Badge 
                                  variant={log.status === "success" ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {log.status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {log.resourceType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">{log.actor}</span> → {log.resource}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {log.timestamp}
                            </span>
                          </div>

                          <p className="text-sm">{log.details}</p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>IP: {log.ipAddress}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
                  <p className="text-muted-foreground">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {mockAuditLogs.filter(l => l.status === "success").length}
              </div>
              <div className="text-sm text-muted-foreground">Successful Actions</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {mockAuditLogs.filter(l => l.status === "failed").length}
              </div>
              <div className="text-sm text-muted-foreground">Failed Attempts</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {new Set(mockAuditLogs.map(l => l.actor)).size}
              </div>
              <div className="text-sm text-muted-foreground">Unique Actors</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {mockAuditLogs.filter(l => l.action.includes("Privilege Escalation")).length}
              </div>
              <div className="text-sm text-muted-foreground">Privilege Escalation Attempts</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
