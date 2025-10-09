import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usersService, rbacService } from "@/services"
import type { User as ApiUser } from "@/services/users"
import type { Role as ApiRole } from "@/services/rbac"
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

interface User extends ApiUser {
  name?: string; // Computed field from firstName + lastName
  callsToday?: number; // Will be added later
  totalCalls?: number; // Will be added later
  joinDate?: string; // Maps to createdAt
  avatar?: string; // Will be added later
  status?: "active" | "inactive" | "suspended"; // Maps to isActive
}

interface CreateUserFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;  // Backend expects single role string
  isActive: boolean;
}

interface EditUserFormData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;  // Single role like create user
  isActive?: boolean;
}

// Helper function to transform API user to UI user
const transformUser = (apiUser: ApiUser): User => ({
  ...apiUser,
  name: `${apiUser.firstName} ${apiUser.lastName}`,
  status: apiUser.isActive ? "active" : "inactive",
  joinDate: new Date(apiUser.createdAt).toLocaleDateString(),
  callsToday: 0, // TODO: Integrate with call statistics
  totalCalls: 0, // TODO: Integrate with call statistics
  avatar: "",
});

// Component helper functions
function getRoleColor(roles?: Array<{name: string}>) {
  if (!roles || roles.length === 0) return "bg-muted/10 text-muted-foreground border-muted/20"
  
  const role = roles[0]?.name?.toLowerCase();
  switch (role) {
    case "admin": 
    case "super_admin": 
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "manager": 
      return "bg-warning/10 text-warning border-warning/20"
    case "agent": 
      return "bg-success/10 text-success border-success/20"
    default: 
      return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getStatusColor(status?: User["status"]) {
  switch (status) {
    case "active": return "bg-success/10 text-success border-success/20"
    case "inactive": return "bg-muted/10 text-muted-foreground border-muted/20"
    case "suspended": return "bg-destructive/10 text-destructive border-destructive/20"
    default: return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getStatusIcon(status?: User["status"]) {
  switch (status) {
    case "active": return <UserCheck className="w-3 h-3" />
    case "inactive": return <UserX className="w-3 h-3" />
    case "suspended": return <Lock className="w-3 h-3" />
    default: return <UserCheck className="w-3 h-3" />
  }
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<ApiRole[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editUserData, setEditUserData] = useState<EditUserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    isActive: true
  })
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")

  // Development auto-login for testing
  useEffect(() => {
    const autoLogin = async () => {
      try {
        console.log("🔧 Starting auto-login process...");
        console.log("🔧 Environment - DEV mode:", import.meta.env.DEV);
        
        // Direct API call to test login
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: "admin@bank.com",
            password: "demo123"
          }),
        });
        
        console.log("🔧 Login response status:", response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log("🔧 Login success:", result);
          
          // Store token if provided
          if (result.accessToken) {
            localStorage.setItem('dial_craft_token', result.accessToken);
            
            // RBAC integration can be enhanced later
            console.log("🔧 Auth token stored, system ready for user management");
          }
          
          toast({
            title: "Development Login",
            description: "Successfully logged in as admin for testing",
          });
          
          // Load data after successful login
          setTimeout(() => loadData(), 500);
        } else {
          const error = await response.text();
          console.error("❌ Login failed:", response.status, error);
          toast({
            title: "Login Failed", 
            description: `Login failed with status ${response.status}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("❌ Auto-login error:", error);
        toast({
          title: "Auto-login Error",
          description: "Network error during login. Check console for details.",
          variant: "destructive"
        });
      }
    };
    
    // Run auto-login only in development
    if (import.meta.env.DEV) {
      autoLogin();
    }
  }, []);

  // Load users and roles data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("🔄 Loading users and roles data...");
      
      const [usersData, rolesData] = await Promise.all([
        usersService.getUsers(),
        rbacService.getRoles().catch(error => {
          console.error("🚫 Failed to load roles:", error);
          // Return empty array as fallback
          return [];
        })
      ]);
      
      console.log("📊 Users data loaded:", usersData);
      console.log("📊 Roles data loaded:", rolesData);
      console.log("🔧 Number of roles:", rolesData.length);
      
      // Log role selection status
      if (rolesData.length === 0) {
        console.log("⚠️ No RBAC roles loaded, using fallback roles");
      } else {
        console.log("✅ RBAC roles loaded successfully");
      }
      
      setUsers(usersData.map(transformUser));
      setRoles(rolesData);
      
      toast({
        title: "Data Loaded",
        description: `Loaded ${usersData.length} users and ${rolesData.length} roles`,
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast({
        title: "Error",
        description: `Failed to load users and roles: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      await usersService.updateUser(userId, {
        isActive: !user.isActive
      });

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, isActive: !u.isActive, status: !u.isActive ? "active" : "inactive" }
          : u
      ));

      toast({
        title: "Success",
        description: `User ${!user.isActive ? "activated" : "deactivated"} successfully`
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleEditUser = (user: User) => {
    // Populate edit form with user data
    setEditUserData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || '',
      isActive: user.isActive ?? true
    });
    setEditingUser(user);
    setShowEditDialog(true);
  };


  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = selectedRole === "all" || 
                       (user.roles?.some(role => role.name === selectedRole) || false)
    return matchesSearch && matchesRole
  })

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    admins: users.filter(u => u.roles?.some(role => role.name.toLowerCase().includes("admin"))).length,
    managers: users.filter(u => u.roles?.some(role => role.name.toLowerCase().includes("manager"))).length,
    agents: users.filter(u => u.roles?.some(role => role.name.toLowerCase().includes("agent"))).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
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
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-accent hover:shadow-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <CreateUserDialog 
              roles={roles} 
              onSuccess={loadData}
              onClose={() => setShowCreateDialog(false)}
            />
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <EditUserDialog 
              user={editingUser}
              roles={roles}
              editUserData={editUserData}
              setEditUserData={setEditUserData}
              onSuccess={loadData}
              onClose={() => setShowEditDialog(false)}
            />
          </Dialog>
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
            {roles.map(role => (
              <option key={role.id} value={role.name}>
                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
              </option>
            ))}
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
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge key={role.id} className={getRoleColor([role])}>
                              <Shield className="w-3 h-3 mr-1" />
                              {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                            </Badge>
                          ))
                        ) : (
                          <Badge className={getRoleColor()}>
                            <Shield className="w-3 h-3 mr-1" />
                            No Role
                          </Badge>
                        )}
                      </div>
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-light border-glass-border"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-light border-glass-border text-destructive hover:bg-destructive/10"
                          disabled={user.roles?.some(role => role.name.toLowerCase().includes("admin")) || false}
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
              <Button 
                className="bg-gradient-accent hover:shadow-accent"
                onClick={() => setShowCreateDialog(true)}
              >
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

// Create User Dialog Component
interface CreateUserDialogProps {
  roles: ApiRole[];
  onSuccess: () => void;
  onClose: () => void;
}

function CreateUserDialog({ roles, onSuccess, onClose }: CreateUserDialogProps) {
  // Default roles fallback when RBAC is not available
  const DEFAULT_ROLES = [
    { id: 'agent', name: 'AGENT', description: 'Call center agent' },
    { id: 'manager', name: 'MANAGER', description: 'Team manager' },
    { id: 'admin', name: 'ADMIN', description: 'System administrator' },
    { id: 'super_admin', name: 'SUPER_ADMIN', description: 'Super administrator' }
  ];

  // Get available roles - use RBAC roles if available, otherwise use defaults
  const availableRoles = roles.length > 0 ? roles : DEFAULT_ROLES;

  // Get default role from available roles - prefer AGENT, or use first available
  const getDefaultRole = () => {
    const agentRole = availableRoles.find(r => r.name === 'AGENT');
    return agentRole ? agentRole.name : (availableRoles.length > 0 ? availableRoles[0].name : 'AGENT');
  };

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: getDefaultRole(),  // Dynamic default role from database
    isActive: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update role when roles are loaded and current role is empty
  useEffect(() => {
    if (availableRoles.length > 0 && !formData.role) {
      setFormData(prev => ({ ...prev, role: getDefaultRole() }));
    }
  }, [roles, formData.role]); // Keep roles as dependency to trigger when RBAC loads

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('🔧 Creating user with data:', formData);
      
      // Get the stored token
      const token = localStorage.getItem('dial_craft_token');
      console.log('🔧 Using token:', token ? 'Token present' : 'No token');

      // Direct fetch for better error handling
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      console.log('🔧 Create user response status:', response.status);
      console.log('🔧 Create user response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚫 User creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`User creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const newUser = await response.json();
      console.log('✅ User created successfully:', newUser);

      toast({
        title: "Success",
        description: "User created successfully"
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: getDefaultRole(),
        isActive: true
      });
    } catch (error) {
      console.error('🚫 Error creating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Role handling simplified to single role selection

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
            minLength={8}
          />
        </div>

        <div>
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name} {role.description && `- ${role.description}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
          />
          <Label htmlFor="isActive">Active User</Label>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Edit User Dialog Component
interface EditUserDialogProps {
  user: User | null;
  roles: ApiRole[];
  editUserData: EditUserFormData;
  setEditUserData: (data: EditUserFormData | ((prev: EditUserFormData) => EditUserFormData)) => void;
  onSuccess: () => void;
  onClose: () => void;
}

function EditUserDialog({ user, roles, editUserData, setEditUserData, onSuccess, onClose }: EditUserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !editUserData.firstName || !editUserData.lastName || !editUserData.email || !editUserData.role) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        email: editUserData.email,
        firstName: editUserData.firstName,
        lastName: editUserData.lastName,
        role: editUserData.role,
        isActive: editUserData.isActive
      };

      // Use the proper users service instead of manual fetch
      await usersService.updateUser(user.id, updateData);

      toast({
        title: "Success",
        description: "User updated successfully"
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="editFirstName">First Name</Label>
            <Input
              id="editFirstName"
              value={editUserData.firstName || ''}
              onChange={(e) => setEditUserData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="editLastName">Last Name</Label>
            <Input
              id="editLastName"
              value={editUserData.lastName || ''}
              onChange={(e) => setEditUserData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="editEmail">Email</Label>
          <Input
            id="editEmail"
            type="email"
            value={editUserData.email || ''}
            onChange={(e) => setEditUserData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="editRole">Role</Label>
          <Select
            value={editUserData.role || ''}
            onValueChange={(value) => setEditUserData(prev => ({ ...prev, role: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="editIsActive"
            checked={editUserData.isActive || false}
            onChange={(e) => setEditUserData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="editIsActive">User is active</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update User"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}