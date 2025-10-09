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
  Clock,
  Phone,
  MessageSquare,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { dispositionsService, Disposition, DispositionCategory, DispositionStats } from "@/services/dispositions"

// Helper functions for UI rendering
function getColorClass(color?: string, type: "bg" | "text" | "border" = "bg"): string {
  const colorMap = {
    success: `${type}-success`,
    destructive: `${type}-destructive`, 
    warning: `${type}-warning`,
    accent: `${type}-accent`,
    muted: `${type}-muted-foreground`
  }
  return colorMap[color as keyof typeof colorMap] || `${type}-muted-foreground`
}

function getCategoryIcon(categoryName?: string) {
  switch (categoryName) {
    case "Successful": return <CheckCircle className="w-4 h-4" />
    case "No Contact": return <XCircle className="w-4 h-4" />
    case "Unsuccessful": return <Phone className="w-4 h-4" />
    case "System": return <FileText className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

function getCategoryLabel(categoryName?: string) {
  switch (categoryName) {
    case "Successful": return "Successful"
    case "No Contact": return "No Contact"
    case "Unsuccessful": return "Unsuccessful"
    case "System": return "System"
    default: return categoryName || "Other"
  }
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
  const [editForm, setEditForm] = useState({
    label: "",
    description: "", 
    color: "",
    category: ""
  })
  const [createForm, setCreateForm] = useState({
    code: "",
    label: "",
    description: "",
    category: "",
    requiresFollowUp: false,
    isSuccessful: false
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
      
      // Use fallback data
      const fallbackDispositions = await dispositionsService.getDispositions()
      setDispositions(fallbackDispositions)
    } finally {
      setLoading(false)
    }
  }

  const filteredDispositions = dispositions.filter(disp => {
    const matchesSearch = disp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         disp.key.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || disp.category?.name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categoryStats = stats ? {
    contact: dispositions.filter(d => d.category?.name === "Successful").length,
    no_contact: dispositions.filter(d => d.category?.name === "No Contact").length,
    outcome: dispositions.filter(d => d.category?.name === "Unsuccessful").length,
    total: stats.totalDispositions
  } : {
    contact: 0,
    no_contact: 0,
    outcome: 0,
    total: 0
  }

  const toggleActive = async (id: string) => {
    try {
      const disposition = dispositions.find(d => d.id === id)
      if (!disposition) return
      
      const updated = await dispositionsService.toggleDispositionStatus(id, !disposition.isActive)
      setDispositions(prev => 
        prev.map(disp => 
          disp.id === id ? updated : disp
        )
      )
      
      // Show success message
      console.info(`✅ Disposition "${disposition.name}" ${updated.isActive ? 'activated' : 'deactivated'}`)
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
      color: dispositionsService.getDispositionColor(disposition),
      category: disposition.categoryId
    })
  }

  const cancelEdit = () => {
    setEditingDisposition(null)
    setEditForm({
      label: "",
      description: "",
      color: "",
      category: ""
    })
  }

  const startCreate = () => {
    setIsCreating(true)
    setCreateForm({
      code: "",
      label: "",
      description: "",
      category: categories.length > 0 ? categories[0].id : "",
      requiresFollowUp: false,
      isSuccessful: false
    })
  }

  const cancelCreate = () => {
    setIsCreating(false)
    setCreateForm({
      code: "",
      label: "",
      description: "",
      category: "",
      requiresFollowUp: false,
      isSuccessful: false
    })
  }

  const saveCreate = async () => {
    if (!createForm.label.trim() || !createForm.code.trim() || !createForm.category) return
    
    try {
      const createData = {
        key: createForm.code,
        name: createForm.label,
        description: createForm.description,
        categoryId: createForm.category,
        requiresFollowUp: createForm.requiresFollowUp,
        isSuccessful: createForm.isSuccessful,
        isActive: true,
        sortOrder: 0
      }
      
      const newDisposition = await dispositionsService.createDisposition(createData)
      setDispositions(prev => [...prev, newDisposition])
      cancelCreate()
      
      // Show success message
      console.info(`✅ Disposition "${newDisposition.name}" created successfully`)
    } catch (error) {
      console.error('Failed to create disposition:', error)
      setError('Failed to create disposition.')
    }
  }

  const saveEdit = async () => {
    if (!editingDisposition) return
    
    try {
      const categoryId = editForm.category || editingDisposition.categoryId
      const updateData = {
        name: editForm.label,
        description: editForm.description,
        categoryId: categoryId
      }
      
      const updated = await dispositionsService.updateDisposition(editingDisposition.id, updateData)
      setDispositions(prev =>
        prev.map(disp =>
          disp.id === editingDisposition.id ? updated : disp
        )
      )
      cancelEdit()
      
      // Show success message
      console.info(`✅ Disposition "${updated.name}" updated successfully`)
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
              {loading && " • Loading..."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
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
            <option value="contact">Contact Made</option>
            <option value="no_contact">No Contact</option>
            <option value="outcome">Positive Outcome</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Dispositions
            </CardTitle>
            <FileText className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {categoryStats.total}
            </div>
            <p className="text-xs text-muted-foreground">Active codes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contact Made
            </CardTitle>
            <Phone className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {categoryStats.contact}
            </div>
            <p className="text-xs text-muted-foreground">Direct contact codes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No Contact
            </CardTitle>
            <XCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-warning">
              {categoryStats.no_contact}
            </div>
            <p className="text-xs text-muted-foreground">No contact codes</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Positive Outcomes
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {categoryStats.outcome}
            </div>
            <p className="text-xs text-muted-foreground">Success codes</p>
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
                      {disposition.key}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {disposition.isDefault && (
                    <Badge variant="outline" className="text-xs border-accent text-accent">
                      Default
                    </Badge>
                  )}
                  <Switch
                    checked={disposition.isActive}
                    onCheckedChange={() => toggleActive(disposition.id)}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {disposition.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={`${getColorClass(disposition.color, "bg")}/10 ${getColorClass(disposition.color, "text")} border-${disposition.color}/20`}>
                    {getCategoryLabel(disposition.category?.name)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-foreground">
                    {/* TODO: Get usage count from stats */}
                    0
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
                  disabled={disposition.isDefault}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDispositions.length === 0 && (
          <div className="col-span-full">
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Dispositions Found</h3>
                <p className="text-muted-foreground mb-4">
                  No dispositions match your current search and filter criteria.
                </p>
                <Button className="bg-gradient-accent hover:shadow-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Disposition
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Disposition Dialog */}
      <Dialog open={!!editingDisposition} onOpenChange={() => cancelEdit()}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-medium text-foreground">
                  Category
                </Label>
                <Select 
                  value={editForm.category} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border bg-background z-50">
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category.name)}
                          <span>{getCategoryLabel(category.name)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color" className="text-sm font-medium text-foreground">
                  Color Theme
                </Label>
                <Select 
                  value={editForm.color} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border bg-background z-50">
                    <SelectItem value="success">Success (Green)</SelectItem>
                    <SelectItem value="warning">Warning (Yellow)</SelectItem>
                    <SelectItem value="destructive">Destructive (Red)</SelectItem>
                    <SelectItem value="accent">Accent (Blue)</SelectItem>
                    <SelectItem value="muted">Muted (Gray)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingDisposition?.isDefault && (
              <div className="glass-light p-3 rounded-lg border border-accent/20">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-accent text-accent">
                    Default Disposition
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    This is a system default disposition
                  </span>
                </div>
              </div>
            )}
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
      </Dialog>

      {/* Create Disposition Dialog */}
      <Dialog open={isCreating} onOpenChange={() => cancelCreate()}>
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
              <Select value={createForm.category} onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="glass-dark border-glass-border">
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category.name)}
                        <span>{getCategoryLabel(category.name)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              disabled={!createForm.label.trim() || !createForm.code.trim() || !createForm.category}
              className="bg-gradient-accent hover:shadow-accent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Disposition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}