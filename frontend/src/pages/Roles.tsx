import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { rbacService } from "@/services"
import type { Role, Permission, CreateRoleRequest, UpdateRoleRequest } from "@/services/rbac"
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle,
  Lock,
  RefreshCw,
  AlertTriangle
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Roles() {
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    isActive: boolean;
    selectedPermissions: string[];
  }>({
    name: "",
    description: "",
    isActive: true,
    selectedPermissions: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesData, permissionsData] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getPermissions()
      ])
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error("Failed to load RBAC data:", error)
      toast({
        title: "Error",
        description: "Failed to load roles and permissions",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async () => {
    try {
      await rbacService.createRole({
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        permissions: formData.selectedPermissions
      })
      
      toast({
        title: "Success",
        description: "Role created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Failed to create role:", error)
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive"
      })
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      await rbacService.updateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        permissions: formData.selectedPermissions
      })
      
      toast({
        title: "Success",
        description: "Role updated successfully",
      })
      setIsEditDialogOpen(false)
      setSelectedRole(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error("Failed to update role:", error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      await rbacService.deleteRole(selectedRole.id)
      
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedRole(null)
      loadData()
    } catch (error) {
      console.error("Failed to delete role:", error)
      toast({
        title: "Error",
        description: "Failed to delete role. It might be assigned to users.",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      isActive: role.isActive,
      selectedPermissions: role.permissions?.map(p => p.id) || []
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
      selectedPermissions: []
    })
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedPermissions.includes(permissionId)
      if (isSelected) {
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter(id => id !== permissionId)
        }
      } else {
        return {
          ...prev,
          selectedPermissions: [...prev.selectedPermissions, permissionId]
        }
      }
    })
  }

  const toggleCategoryPermissions = (category: string, categoryPermissionIds: string[]) => {
    setFormData(prev => {
      const allSelected = categoryPermissionIds.every(id => prev.selectedPermissions.includes(id))
      
      if (allSelected) {
        // Deselect all
        return {
          ...prev,
          selectedPermissions: prev.selectedPermissions.filter(id => !categoryPermissionIds.includes(id))
        }
      } else {
        // Select all
        const newPermissions = [...prev.selectedPermissions]
        categoryPermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id)
          }
        })
        return {
          ...prev,
          selectedPermissions: newPermissions
        }
      }
    })
  }

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              Role Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user roles and permissions
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="glass-light border-glass-border"
              onClick={loadData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="bg-gradient-accent hover:shadow-accent"
              onClick={() => {
                resetForm()
                setIsCreateDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-light border-glass-border pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRoles.map((role) => (
          <Card key={role.id} className="glass-card hover:shadow-accent transition-all duration-300 flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <Shield className={`w-5 h-5 ${role.isSystemRole ? 'text-accent' : 'text-primary'}`} />
                  <CardTitle className="text-xl">{role.name}</CardTitle>
                </div>
                {role.isSystemRole && (
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                    System
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-2 min-h-[40px]">
                {role.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-success" />
                  {role.permissions?.length || 0} Permissions
                </div>
                <div className="flex items-center">
                  <Badge variant={role.isActive ? "default" : "destructive"} className={role.isActive ? "bg-success/10 text-success border-success/20" : ""}>
                    {role.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => openEditDialog(role)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                {!role.isSystemRole && (
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => {
                      setSelectedRole(role)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="glass-dialog border-glass-border max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isCreateDialogOpen ? "Create New Role" : "Edit Role"}</DialogTitle>
            <DialogDescription>
              Configure role details and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Senior Agent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="status"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="status" className="font-normal">
                    {formData.isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role's responsibilities..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Permissions</Label>
                <Badge variant="outline">
                  {formData.selectedPermissions.length} Selected
                </Badge>
              </div>

              <ScrollArea className="h-[400px] rounded-md border p-4">
                <Accordion type="multiple" className="w-full">
                  {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => {
                    const categoryPermissionIds = categoryPermissions.map(p => p.id)
                    const allSelected = categoryPermissionIds.every(id => formData.selectedPermissions.includes(id))
                    const someSelected = categoryPermissionIds.some(id => formData.selectedPermissions.includes(id))

                    return (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center space-x-4 w-full">
                            <div 
                              className="flex items-center space-x-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCategoryPermissions(category, categoryPermissionIds)
                              }}
                            >
                              <div className="flex items-center justify-center w-4 h-4 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground">
                                {allSelected && <CheckCircle className="h-3 w-3" />}
                                {someSelected && !allSelected && <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                              </div>
                              <span className="font-semibold">{category}</span>
                            </div>
                            <Badge variant="secondary" className="ml-auto mr-4">
                              {categoryPermissions.filter(p => formData.selectedPermissions.includes(p.id)).length} / {categoryPermissions.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 pl-6">
                            {categoryPermissions.map((permission) => (
                              <div 
                                key={permission.id} 
                                className="flex items-start space-x-2 p-2 rounded hover:bg-accent/5 cursor-pointer"
                                onClick={() => togglePermission(permission.id)}
                              >
                                <Checkbox 
                                  id={permission.id}
                                  checked={formData.selectedPermissions.includes(permission.id)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                  <label
                                    htmlFor={permission.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {permission.name}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-accent hover:shadow-accent"
              onClick={isCreateDialogOpen ? handleCreateRole : handleUpdateRole}
              disabled={!formData.name}
            >
              {isCreateDialogOpen ? "Create Role" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="glass-dialog border-glass-border">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 bg-destructive/10 rounded-md text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p className="text-sm">Users assigned to this role will lose their permissions.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRole}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
