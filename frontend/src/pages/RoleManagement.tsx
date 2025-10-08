import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Plus, Edit, Trash2, Users, Lock, Search, Loader2, RefreshCw } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { rbacService, type Role as ApiRole, type Permission as ApiPermission, type CreateRoleRequest, type UpdateRoleRequest } from "@/services/rbac"

export default function RoleManagement() {
  const [roles, setRoles] = useState<ApiRole[]>([])
  const [permissions, setPermissions] = useState<ApiPermission[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<ApiRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[]
  })

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions()
      ])
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error('Failed to load RBAC data:', error)
      toast.error('Failed to load roles and permissions')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleCreateRole = async () => {
    if (!formData.name.trim()) {
      toast.error("Role name is required")
      return
    }

    setIsSubmitting(true)
    try {
      const createData: CreateRoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        isActive: true,
        permissions: formData.permissions
      }

      const newRole = await rbacService.createRole(createData)
      setRoles([...roles, newRole])
      setIsCreateDialogOpen(false)
      resetForm()
      toast.success("Role created successfully")
    } catch (error) {
      console.error('Failed to create role:', error)
      toast.error('Failed to create role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingRole) return

    setIsSubmitting(true)
    try {
      const updateData: UpdateRoleRequest = {
        name: formData.name,
        description: formData.description || undefined,
        isActive: true,
        permissions: formData.permissions
      }

      const updatedRole = await rbacService.updateRole(editingRole.id, updateData)
      
      const updatedRoles = roles.map(role => 
        role.id === editingRole.id ? updatedRole : role
      )

      setRoles(updatedRoles)
      setEditingRole(null)
      resetForm()
      toast.success("Role updated successfully")
    } catch (error) {
      console.error('Failed to update role:', error)
      toast.error('Failed to update role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystemRole) {
      toast.error("Cannot delete system role")
      return
    }

    try {
      await rbacService.deleteRole(roleId)
      setRoles(roles.filter(r => r.id !== roleId))
      toast.success("Role deleted successfully")
    } catch (error) {
      console.error('Failed to delete role:', error)
      toast.error('Failed to delete role')
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: []
    })
  }

  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const openEditDialog = (role: ApiRole) => {
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions?.map(p => p.id) || []
    })
    setEditingRole(role)
  }

  const closeEditDialog = () => {
    setEditingRole(null)
    resetForm()
  }

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, ApiPermission[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading roles and permissions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground">
            Define and manage user roles with granular permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter role name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter role description"
                    rows={3}
                  />
                </div>

                {/* Permissions Section */}
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-4">
                    {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{category}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const categoryPermissionIds = categoryPermissions.map(p => p.id)
                              const hasAllSelected = categoryPermissionIds.every(id => formData.permissions.includes(id))
                              
                              if (hasAllSelected) {
                                // Deselect all in category
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: prev.permissions.filter(id => !categoryPermissionIds.includes(id))
                                }))
                              } else {
                                // Select all in category
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: [...new Set([...prev.permissions, ...categoryPermissionIds])]
                                }))
                              }
                            }}
                          >
                            {categoryPermissions.every(p => formData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`create-${permission.id}`}
                                checked={formData.permissions.includes(permission.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      permissions: [...prev.permissions, permission.id]
                                    }))
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      permissions: prev.permissions.filter(id => id !== permission.id)
                                    }))
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`create-${permission.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the permissions this role should have. Users with this role will have access to these features.
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRole}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Roles List */}
      <div className="space-y-4">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      {role.isSystemRole && (
                        <Badge variant="secondary" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          System
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={role.isSystemRole}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{role.userCount || 0} users</span>
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>{role.permissions?.length || 0} permissions</span>
                </div>
              </div>
              
              {role.permissions && role.permissions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 5).map((permission) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.name.replace(/^(Create|View|Edit|Delete|Manage|Update|Upload)\s+/i, '')}
                    </Badge>
                  ))}
                  {role.permissions.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 5} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? "No roles found matching your search." : "No roles found. Create your first role to get started."}
          </p>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => editingRole && closeEditDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role: {editingRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Role Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter role name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter role description"
                rows={3}
              />
            </div>

            {/* Permissions Section */}
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="max-h-64 overflow-y-auto border rounded-md p-4 space-y-4">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{category}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const categoryPermissionIds = categoryPermissions.map(p => p.id)
                          const hasAllSelected = categoryPermissionIds.every(id => formData.permissions.includes(id))
                          
                          if (hasAllSelected) {
                            // Deselect all in category
                            setFormData(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(id => !categoryPermissionIds.includes(id))
                            }))
                          } else {
                            // Select all in category
                            setFormData(prev => ({
                              ...prev,
                              permissions: [...new Set([...prev.permissions, ...categoryPermissionIds])]
                            }))
                          }
                        }}
                      >
                        {categoryPermissions.every(p => formData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {categoryPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${permission.id}`}
                            checked={formData.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: [...prev.permissions, permission.id]
                                }))
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  permissions: prev.permissions.filter(id => id !== permission.id)
                                }))
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`edit-${permission.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select the permissions this role should have. Users with this role will have access to these features.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={closeEditDialog}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}