import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Plus, Edit, Trash2, Users, Lock, Search } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Permission {
  id: string
  code: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  isSystemRole: boolean
  createdAt: string
  updatedBy: string
}

const mockPermissions: Permission[] = [
  { id: "1", code: "accounts.view", name: "View Accounts", description: "Can view account details", category: "Accounts" },
  { id: "2", code: "accounts.edit", name: "Edit Accounts", description: "Can modify account information", category: "Accounts" },
  { id: "3", code: "accounts.delete", name: "Delete Accounts", description: "Can delete accounts", category: "Accounts" },
  { id: "4", code: "calls.view", name: "View Calls", description: "Can view call history", category: "Calls" },
  { id: "5", code: "calls.make", name: "Make Calls", description: "Can initiate calls", category: "Calls" },
  { id: "6", code: "reports.view", name: "View Reports", description: "Can access reports", category: "Reports" },
  { id: "7", code: "reports.export", name: "Export Reports", description: "Can export report data", category: "Reports" },
  { id: "8", code: "users.view", name: "View Users", description: "Can view user list", category: "Users" },
  { id: "9", code: "users.manage", name: "Manage Users", description: "Can create/edit/delete users", category: "Users" },
  { id: "10", code: "roles.view", name: "View Roles", description: "Can view roles", category: "RBAC" },
  { id: "11", code: "roles.manage", name: "Manage Roles", description: "Can create/edit/delete roles", category: "RBAC" },
  { id: "12", code: "permissions.manage", name: "Manage Permissions", description: "Can modify permissions", category: "RBAC" },
]

const mockRoles: Role[] = [
  {
    id: "1",
    name: "Super Admin",
    description: "Full system access with all permissions",
    permissions: mockPermissions.map(p => p.id),
    userCount: 2,
    isSystemRole: true,
    createdAt: "2024-01-15",
    updatedBy: "System"
  },
  {
    id: "2",
    name: "Manager",
    description: "Can manage team, view reports, and oversee operations",
    permissions: ["1", "2", "4", "5", "6", "7", "8"],
    userCount: 8,
    isSystemRole: false,
    createdAt: "2024-01-20",
    updatedBy: "admin@jdgk.com"
  },
  {
    id: "3",
    name: "Agent",
    description: "Basic access for collection agents",
    permissions: ["1", "4", "5"],
    userCount: 45,
    isSystemRole: false,
    createdAt: "2024-01-20",
    updatedBy: "admin@jdgk.com"
  },
  {
    id: "4",
    name: "Viewer",
    description: "Read-only access to view data",
    permissions: ["1", "4", "6"],
    userCount: 12,
    isSystemRole: false,
    createdAt: "2024-02-01",
    updatedBy: "manager@jdgk.com"
  },
]

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  })

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateRole = () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required")
      return
    }

    const newRole: Role = {
      id: String(roles.length + 1),
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions,
      userCount: 0,
      isSystemRole: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedBy: "current.user@jdgk.com"
    }

    setRoles([...roles, newRole])
    setIsCreateDialogOpen(false)
    resetForm()
    toast.success("Role created successfully")
  }

  const handleUpdateRole = () => {
    if (!editingRole) return

    const updatedRoles = roles.map(role => 
      role.id === editingRole.id 
        ? { ...role, name: formData.name, description: formData.description, permissions: formData.permissions }
        : role
    )

    setRoles(updatedRoles)
    setEditingRole(null)
    resetForm()
    toast.success("Role updated successfully")
  }

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystemRole) {
      toast.error("Cannot delete system role")
      return
    }

    setRoles(roles.filter(r => r.id !== roleId))
    toast.success("Role deleted successfully")
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    })
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] })
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const groupedPermissions = mockPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage user roles with granular permissions
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Team Lead"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role's purpose and responsibilities"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Permissions</Label>
                {Object.entries(groupedPermissions).map(([category, permissions]) => (
                  <Card key={category}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={formData.permissions.includes(permission.id)}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {permission.name}
                            </label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRoles.map(role => (
              <Card key={role.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{role.name}</h3>
                            {role.isSystemRole && (
                              <Badge variant="secondary">
                                <Lock className="mr-1 h-3 w-3" />
                                System
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground pl-12">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{role.userCount} users</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          <span>{role.permissions.length} permissions</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pl-12">
                        {role.permissions.slice(0, 5).map(permId => {
                          const perm = mockPermissions.find(p => p.id === permId)
                          return perm ? (
                            <Badge key={permId} variant="outline" className="text-xs">
                              {perm.name}
                            </Badge>
                          ) : null
                        })}
                        {role.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(role)}
                            disabled={role.isSystemRole}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Role</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Role Name *</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                              />
                            </div>

                            <div className="space-y-3">
                              <Label>Permissions</Label>
                              {Object.entries(groupedPermissions).map(([category, permissions]) => (
                                <Card key={category}>
                                  <CardHeader className="py-3">
                                    <CardTitle className="text-sm font-medium">{category}</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    {permissions.map(permission => (
                                      <div key={permission.id} className="flex items-start space-x-2">
                                        <Checkbox
                                          id={`edit-${permission.id}`}
                                          checked={formData.permissions.includes(permission.id)}
                                          onCheckedChange={() => togglePermission(permission.id)}
                                        />
                                        <div className="flex-1">
                                          <label
                                            htmlFor={`edit-${permission.id}`}
                                            className="text-sm font-medium cursor-pointer"
                                          >
                                            {permission.name}
                                          </label>
                                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingRole(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateRole}>Save Changes</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.isSystemRole}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredRoles.length === 0 && (
              <div className="text-center py-12">
                <Shield className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-semibold">No roles found</h3>
                <p className="text-muted-foreground">Try adjusting your search query</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
