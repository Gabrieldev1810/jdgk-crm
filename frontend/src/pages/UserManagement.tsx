import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { 
  Users, 
  Plus,
  Search,
  Shield,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Settings,
  Lock,
  Unlock,
  Mail,
  Phone
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "agent"
  status: "active" | "inactive" | "suspended"
  lastLogin: string
  callsToday: number
  totalCalls: number
  joinDate: string
  avatar?: string
}

// Mock data
const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "John Admin",
    email: "admin@bank.com",
    role: "admin",
    status: "active",
    lastLogin: "2024-01-15 14:30",
    callsToday: 0,
    totalCalls: 156,
    joinDate: "2023-06-15",
    avatar: ""
  },
  {
    id: "USR-002",
    name: "Sarah Manager",
    email: "manager@bank.com", 
    role: "manager",
    status: "active",
    lastLogin: "2024-01-15 13:45",
    callsToday: 12,
    totalCalls: 2847,
    joinDate: "2023-08-20",
    avatar: ""
  },
  {
    id: "USR-003",
    name: "Mike Agent",
    email: "agent@bank.com",
    role: "agent", 
    status: "active",
    lastLogin: "2024-01-15 14:25",
    callsToday: 47,
    totalCalls: 8924,
    joinDate: "2023-09-10",
    avatar: ""
  },
  {
    id: "USR-004",
    name: "Lisa Agent",
    email: "lisa.agent@bank.com",
    role: "agent",
    status: "active", 
    lastLogin: "2024-01-15 12:15",
    callsToday: 38,
    totalCalls: 6745,
    joinDate: "2023-10-05",
    avatar: ""
  },
  {
    id: "USR-005",
    name: "Tom Agent",
    email: "tom.agent@bank.com",
    role: "agent",
    status: "inactive",
    lastLogin: "2024-01-10 16:30",
    callsToday: 0,
    totalCalls: 4532,
    joinDate: "2023-11-12",
    avatar: ""
  }
]

function getRoleColor(role: User["role"]) {
  switch (role) {
    case "admin": return "bg-destructive/10 text-destructive border-destructive/20"
    case "manager": return "bg-warning/10 text-warning border-warning/20"
    case "agent": return "bg-success/10 text-success border-success/20"
    default: return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getStatusColor(status: User["status"]) {
  switch (status) {
    case "active": return "bg-success/10 text-success border-success/20"
    case "inactive": return "bg-muted/10 text-muted-foreground border-muted/20"
    case "suspended": return "bg-destructive/10 text-destructive border-destructive/20"
    default: return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getStatusIcon(status: User["status"]) {
  switch (status) {
    case "active": return <UserCheck className="w-3 h-3" />
    case "inactive": return <UserX className="w-3 h-3" />
    case "suspended": return <Lock className="w-3 h-3" />
    default: return <UserCheck className="w-3 h-3" />
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState(mockUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    ))
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.role === "admin").length,
    managers: users.filter(u => u.role === "manager").length,
    agents: users.filter(u => u.role === "agent").length
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage system users and access permissions
            </p>
          </div>
          <Button className="bg-gradient-accent hover:shadow-accent">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-light border-glass-border pl-10 focus:ring-accent focus:border-accent"
            />
          </div>
          <select 
            className="glass-light border-glass-border rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="agent">Agent</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">System users</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admins
            </CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {stats.admins}
            </div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Managers
            </CardTitle>
            <Settings className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-warning">
              {stats.managers}
            </div>
            <p className="text-xs text-muted-foreground">Team managers</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents
            </CardTitle>
            <Phone className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {stats.agents}
            </div>
            <p className="text-xs text-muted-foreground">Call center agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-accent" />
            <span>System Users</span>
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} of {users.length} users shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Performance</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id}
                    className="border-b border-glass-border/50 hover:bg-glass-light/30 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="bg-gradient-accent text-accent-foreground font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getRoleColor(user.role)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(user.status)}>
                        {getStatusIcon(user.status)}
                        <span className="ml-1">{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-mono font-bold text-foreground">
                          {user.callsToday} calls today
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.totalCalls.toLocaleString()} total calls
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-mono text-foreground">{user.lastLogin}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {user.joinDate}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Switch
                          checked={user.status === "active"}
                          onCheckedChange={() => toggleUserStatus(user.id)}
                          className="data-[state=checked]:bg-accent"
                        />
                        <Button variant="outline" size="sm" className="glass-light border-glass-border">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-light border-glass-border text-destructive hover:bg-destructive/10"
                          disabled={user.role === "admin"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
              <p className="text-muted-foreground mb-4">
                No users match your current search and filter criteria.
              </p>
              <Button className="bg-gradient-accent hover:shadow-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}