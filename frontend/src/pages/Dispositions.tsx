import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
  RefreshCw
} from "lucide-react"
import { dispositionsService, Disposition, DispositionCategory, DispositionStats } from "@/services/dispositions"

// Helper functions for UI rendering
function getColorClass(color?: string, type: "bg" | "text" | "border" = "bg"): string {
  const colorMap: Record<string, string> = {
    success: `${type}-success`,
    destructive: `${type}-destructive`,
    warning: `${type}-warning`,
    accent: `${type}-accent`,
    muted: `${type}-muted-foreground`,
  }
  return colorMap[color || "muted"] || `${type}-muted-foreground`
}

function getCategoryIcon(categoryName?: string) {
  const name = categoryName?.toLowerCase() || "";
  if (name.includes("success")) return <CheckCircle className="w-4 h-4" />
  if (name.includes("no contact")) return <XCircle className="w-4 h-4" />
  if (name.includes("unsuccessful") || name.includes("fail")) return <Phone className="w-4 h-4" />
  if (name.includes("system")) return <FileText className="w-4 h-4" />
  return <FileText className="w-4 h-4" />
}

export default function Dispositions() {
  const [dispositions, setDispositions] = useState<Disposition[]>([])
  const [categories, setCategories] = useState<DispositionCategory[]>([])
  const [stats, setStats] = useState<DispositionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [editingDisposition, setEditingDisposition] = useState<Disposition | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    label: "",
    description: "",
    categoryId: "",
    newAccountStatus: "",
    followUpDelay: 0
  })

  // Create form state
  const [createForm, setCreateForm] = useState({
    code: "",
    label: "",
    description: "",
    categoryId: "",
    requiresFollowUp: false,
    isSuccessful: false,
    newAccountStatus: "",
    followUpDelay: 0
  })

  // Load dispositions data
  useEffect(() => {
    loadDispositionsData()
  }, [])

  const loadDispositionsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dispositionsData, categoriesData, statsData] = await Promise.all([
        dispositionsService.getDispositions(),
        dispositionsService.getCategories(),
        dispositionsService.getDispositionStats()
      ])

      setDispositions(dispositionsData)
      setCategories(categoriesData)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to load dispositions data:', err)
      setError('Failed to load dispositions data')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncVicidial = async () => {
    try {
      setLoading(true)
      const result = await dispositionsService.syncVicidialStatuses()
      alert(`Synced ${result.count} dispositions from Vicidial.`)
      loadDispositionsData()
    } catch (error) {
      console.error("Failed to sync Vicidial dispositions:", error)
      alert("Failed to sync Vicidial dispositions. Please check the console for details.")
    } finally {
      setLoading(false)
    }
  }

  const filteredDispositions = dispositions.filter(disp => {
    const matchesSearch = disp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disp.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || disp.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Calculate stats from loaded data
  const categoryStats = {
    contact: dispositions.filter(d => d.category?.name?.toLowerCase().includes("success")).length,
    no_contact: dispositions.filter(d => d.category?.name?.toLowerCase().includes("no contact")).length,
    outcome: dispositions.filter(d => d.category?.name?.toLowerCase().includes("unsuccessful")).length,
    total: dispositions.length
  }

  const toggleActive = async (id: string) => {
    try {
      const disposition = dispositions.find(d => d.id === id)
      if (!disposition) return

      const updated = await dispositionsService.updateDisposition(id, { isActive: !disposition.isActive })
      setDispositions(prev =>
        prev.map(disp =>
          disp.id === id ? updated : disp
        )
      )
    } catch (error) {
      console.error('Failed to toggle disposition status:', error)
      setError('Failed to update disposition status.')
    }
  }

  const startEdit = (disposition: Disposition) => {
    setEditingDisposition(disposition)
    setEditForm({
      label: disposition.name,
      description: disposition.description || "",
      categoryId: disposition.categoryId,
      newAccountStatus: disposition.newAccountStatus || "",
      followUpDelay: disposition.followUpDelay || 0
    })
  }

  const cancelEdit = () => {
    setEditingDisposition(null)
    setEditForm({
      label: "",
      description: "",
      categoryId: "",
      newAccountStatus: "",
      followUpDelay: 0
    })
  }

  const startCreate = () => {
    setIsCreating(true)
    setCreateForm({
      code: "",
      label: "",
      description: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      requiresFollowUp: false,
      isSuccessful: false,
      newAccountStatus: "",
      followUpDelay: 0
    })
  }

  const cancelCreate = () => {
    setIsCreating(false)
    setCreateForm({
      code: "",
      label: "",
      description: "",
      categoryId: "",
      requiresFollowUp: false,
      isSuccessful: false,
      newAccountStatus: "",
      followUpDelay: 0
    })
  }

  const saveCreate = async () => {
    if (!createForm.label.trim() || !createForm.code.trim() || !createForm.categoryId) return

    try {
      const createData = {
        code: createForm.code,
        name: createForm.label,
        description: createForm.description,
        categoryId: createForm.categoryId,
        requiresFollowUp: createForm.requiresFollowUp,
        isSuccessful: createForm.isSuccessful,
        newAccountStatus: createForm.newAccountStatus || undefined,
        followUpDelay: createForm.followUpDelay || undefined,
        isActive: true,
        sortOrder: 0
      }

      const newDisposition = await dispositionsService.createDisposition(createData)
      loadDispositionsData() 
      cancelCreate()
    } catch (error) {
      console.error('Failed to create disposition:', error)
      setError('Failed to create disposition.')
    }
  }

  const saveEdit = async () => {
    if (!editingDisposition) return

    try {
      const updateData = {
        name: editForm.label,
        description: editForm.description,
        categoryId: editForm.categoryId,
        newAccountStatus: editForm.newAccountStatus || undefined,
        followUpDelay: editForm.followUpDelay || undefined
      }

      const updated = await dispositionsService.updateDisposition(editingDisposition.id, updateData)
      loadDispositionsData()
      cancelEdit()
    } catch (error) {
      console.error('Failed to update disposition:', error)
      setError('Failed to update disposition.')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 grid grid-rows-[auto_auto_1fr] gap-6 animate-fade-in">
      {/* Status Banner */}
      <div className="glass-card p-4 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Full Backend Integration: All CRUD operations now available
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Create, read, update, and delete dispositions with real-time persistence to the database.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              Call Dispositions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage call outcome codes and agent disposition options
              {loading && "  Loading..."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              className="glass-light border-glass-border"
              onClick={handleSyncVicidial}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Vicidial
            </Button>
            {error && (
              <Button variant="outline" size="sm" onClick={loadDispositionsData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
            <Button className="bg-gradient-accent hover:shadow-accent" onClick={startCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Disposition
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Input
              placeholder="Search dispositions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-light border-glass-border focus:ring-accent focus:border-accent"
            />
          </div>
          <select
            className="glass-light border-glass-border rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Dispositions
            </CardTitle>
            <FileText className="h-3 w-3 text-accent" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold font-mono text-foreground">
              {categoryStats.total}
            </div>
            <p className="text-[10px] text-muted-foreground">Active codes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Contact Made
            </CardTitle>
            <Phone className="h-3 w-3 text-success" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold font-mono text-success">
              {categoryStats.contact}
            </div>
            <p className="text-[10px] text-muted-foreground">Direct contact codes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              No Contact
            </CardTitle>
            <XCircle className="h-3 w-3 text-warning" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold font-mono text-warning">
              {categoryStats.no_contact}
            </div>
            <p className="text-[10px] text-muted-foreground">No contact codes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Positive Outcomes
            </CardTitle>
            <CheckCircle className="h-3 w-3 text-success" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold font-mono text-success">
              {categoryStats.outcome}
            </div>
            <p className="text-[10px] text-muted-foreground">Success codes</p>
          </CardContent>
        </Card>
      </div>

      {/* Dispositions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">
        {filteredDispositions.map((disposition, index) => (
          <Card
            key={disposition.id}
            className="glass-card hover:shadow-accent transition-all duration-300 animate-slide-up h-fit"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(disposition.category?.name)}
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {disposition.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-muted-foreground">
                      {disposition.code}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={disposition.isActive}
                    onCheckedChange={() => toggleActive(disposition.id)}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
              </div>
            </CardHeader >

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {disposition.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getColorClass(disposition.category?.color, "bg")}/10 ${getColorClass(disposition.category?.color, "text")} border-${disposition.category?.color}/20`}>
                    {disposition.category?.name || "Uncategorized"}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-foreground">
                    {disposition.usageCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">uses</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 glass-light border-glass-border"
                  onClick={() => startEdit(disposition)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-light border-glass-border text-destructive hover:bg-destructive/10"
                  onClick={() => {
                      if(confirm("Are you sure you want to delete this disposition?")) {
                          dispositionsService.deleteDisposition(disposition.id).then(() => loadDispositionsData());
                      }
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card >
        ))
        }

        {
          filteredDispositions.length === 0 && (
            <div className="col-span-full">
              <Card className="glass-card">
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Dispositions Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No dispositions match your current search and filter criteria.
                  </p>
                  <Button className="bg-gradient-accent hover:shadow-accent" onClick={startCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Disposition
                  </Button>
                </CardContent>
              </Card>
            </div>
          )
        }
      </div >

      {/* Edit Disposition Dialog */}
      < Dialog open={!!editingDisposition} onOpenChange={() => cancelEdit()}>
        <DialogContent className="glass-dialog border-glass-border max-w-md z-50 pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Disposition</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modify the disposition details below. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label" className="text-sm font-medium text-foreground">
                Display Label
              </Label>
              <Input
                id="edit-label"
                value={editForm.label}
                onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                className="glass-light border-glass-border focus:ring-accent focus:border-accent"
                placeholder="Enter disposition label..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                className="glass-light border-glass-border focus:ring-accent focus:border-accent"
                placeholder="Enter description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-medium text-foreground">
                  Category
                </Label>
                <Select
                  value={editForm.categoryId}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border bg-background z-50">
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category.name)}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            <div className="space-y-2">
              <Label htmlFor="edit-new-status" className="text-sm font-medium text-foreground">
                New Account Status (Automation)
              </Label>
              <Select
                value={editForm.newAccountStatus || "none"}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, newAccountStatus: value === "none" ? "" : value }))}
              >
                <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent className="glass-card border-glass-border bg-background z-50">
                  <SelectItem value="none">No change</SelectItem>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="INTERESTED">Interested</SelectItem>
                  <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="CALLBACK">Callback</SelectItem>
                  <SelectItem value="DNC">Do Not Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-delay" className="text-sm font-medium text-foreground">
                Follow-up Delay (Minutes)
              </Label>
              <Input
                id="edit-delay"
                type="number"
                min="0"
                value={editForm.followUpDelay}
                onChange={(e) => setEditForm(prev => ({ ...prev, followUpDelay: parseInt(e.target.value) || 0 }))}
                className="glass-light border-glass-border focus:ring-accent focus:border-accent"
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={cancelEdit}
              className="glass-light border-glass-border"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              className="bg-gradient-accent hover:shadow-accent"
              disabled={!editForm.label.trim() || !editForm.description.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >

      {/* Create Disposition Dialog */}
      < Dialog open={isCreating} onOpenChange={() => cancelCreate()}>
        <DialogContent className="glass-dialog border-glass-border max-w-md z-50 pointer-events-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Disposition</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new call disposition code for agents to use.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Disposition Code */}
            <div>
              <Label htmlFor="create-code" className="text-sm font-medium text-foreground">
                Disposition Code *
              </Label>
              <Input
                id="create-code"
                placeholder="e.g., CALLBACK, SALE, NO_ANSWER"
                value={createForm.code}
                onChange={(e) => setCreateForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="glass-light border-glass-border focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Disposition Name */}
            <div>
              <Label htmlFor="create-label" className="text-sm font-medium text-foreground">
                Display Name *
              </Label>
              <Input
                id="create-label"
                placeholder="e.g., Callback Requested, Sale Completed"
                value={createForm.label}
                onChange={(e) => setCreateForm(prev => ({ ...prev, label: e.target.value }))}
                className="glass-light border-glass-border focus:ring-accent focus:border-accent"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="create-description" className="text-sm font-medium text-foreground">
                Description
              </Label>
              <Textarea
                id="create-description"
                placeholder="Describe when to use this disposition..."
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                className="glass-light border-glass-border focus:ring-accent focus:border-accent min-h-[80px]"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="create-category" className="text-sm font-medium text-foreground">
                Category *
              </Label>
              <Select value={createForm.categoryId} onValueChange={(value) => setCreateForm(prev => ({ ...prev, categoryId: value }))}>
                <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-glass-border">
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category.name)}
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Automation Settings */}
            <div className="space-y-4 pt-2 border-t border-border/50">
              <h4 className="text-sm font-medium text-muted-foreground">Automation Settings</h4>
              
              <div>
                <Label htmlFor="create-new-status" className="text-sm font-medium text-foreground">
                  New Account Status
                </Label>
                <Select 
                  value={createForm.newAccountStatus || "none"} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, newAccountStatus: value === "none" ? "" : value }))}
                >
                  <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent className="glass-dark border-glass-border">
                    <SelectItem value="none">No change</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="INTERESTED">Interested</SelectItem>
                    <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="CALLBACK">Callback</SelectItem>
                    <SelectItem value="DNC">Do Not Call</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Automatically update account status when this disposition is selected</p>
              </div>

              <div>
                <Label htmlFor="create-delay" className="text-sm font-medium text-foreground">
                  Follow-up Delay (Minutes)
                </Label>
                <Input
                  id="create-delay"
                  type="number"
                  min="0"
                  value={createForm.followUpDelay}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, followUpDelay: parseInt(e.target.value) || 0 }))}
                  className="glass-light border-glass-border focus:ring-accent focus:border-accent"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Delay before the account appears in queues again</p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-foreground">Requires Follow-up</Label>
                  <p className="text-xs text-muted-foreground">Mark if this disposition requires a follow-up call</p>
                </div>
                <Switch
                  checked={createForm.requiresFollowUp}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, requiresFollowUp: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-foreground">Successful Outcome</Label>
                  <p className="text-xs text-muted-foreground">Mark if this represents a successful call result</p>
                </div>
                <Switch
                  checked={createForm.isSuccessful}
                  onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isSuccessful: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={cancelCreate}
              className="glass-light border-glass-border hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={saveCreate}
              disabled={!createForm.label.trim() || !createForm.code.trim() || !createForm.categoryId}
              className="bg-gradient-accent hover:shadow-accent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Disposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  )
}
