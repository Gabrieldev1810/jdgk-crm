import { useState } from "react"
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
  MessageSquare
} from "lucide-react"

interface Disposition {
  id: string
  key: string
  label: string
  description: string
  color: string
  category: "contact" | "no_contact" | "outcome"
  isDefault: boolean
  isActive: boolean
  usageCount: number
}

// Mock data - PRD aligned dispositions
const mockDispositions: Disposition[] = [
  // PRD Required Dispositions
  {
    id: "1",
    key: "PTP",
    label: "✅ PTP (Promise to Pay)",
    description: "Customer promised to pay by specific date",
    color: "success",
    category: "outcome",
    isDefault: true,
    isActive: true,
    usageCount: 245
  },
  {
    id: "2", 
    key: "COLLECTED",
    label: "💰 Collected",
    description: "Payment collected successfully",
    color: "success",
    category: "outcome", 
    isDefault: true,
    isActive: true,
    usageCount: 189
  },
  {
    id: "3",
    key: "NOT_COLLECTED",
    label: "❌ Not Collected",
    description: "Unable to collect payment",
    color: "destructive",
    category: "contact",
    isDefault: true,
    isActive: true,
    usageCount: 156
  },
  {
    id: "4",
    key: "NO_ANSWER",
    label: "📞 No Answer",
    description: "Phone rang but no one answered",
    color: "warning",
    category: "no_contact",
    isDefault: true,
    isActive: true,
    usageCount: 423
  },
  {
    id: "5",
    key: "WRONG_NUMBER",
    label: "📵 Wrong Number", 
    description: "Phone number is incorrect or not working",
    color: "destructive",
    category: "no_contact",
    isDefault: true,
    isActive: true,
    usageCount: 312
  },
  {
    id: "6",
    key: "TOUCHED",
    label: "🟢 Touched",
    description: "Account has been contacted",
    color: "success",
    category: "contact",
    isDefault: true,
    isActive: true,
    usageCount: 89
  },
  {
    id: "7",
    key: "UNTOUCHED",
    label: "🔴 Untouched",
    description: "Account has not been contacted yet",
    color: "destructive",
    category: "no_contact",
    isDefault: true,
    isActive: true,
    usageCount: 134
  },
  // Additional custom dispositions
  {
    id: "8",
    key: "CALLBACK_REQUESTED",
    label: "Callback Requested",
    description: "Customer requested specific callback time",
    color: "accent",
    category: "contact",
    isDefault: false,
    isActive: true,
    usageCount: 67
  },
  {
    id: "9",
    key: "DISPUTE_CLAIM",
    label: "Dispute Claim",
    description: "Customer disputes the debt amount",
    color: "warning",
    category: "contact", 
    isDefault: false,
    isActive: true,
    usageCount: 34
  },
  {
    id: "10",
    key: "VOICEMAIL_LEFT",
    label: "Voicemail Left", 
    description: "Left detailed voicemail message",
    color: "accent",
    category: "no_contact",
    isDefault: false,
    isActive: true,
    usageCount: 198
  }
]

function getColorClass(color: string, type: "bg" | "text" | "border" = "bg") {
  const colorMap = {
    success: `${type}-success`,
    destructive: `${type}-destructive`, 
    warning: `${type}-warning`,
    accent: `${type}-accent`,
    muted: `${type}-muted-foreground`
  }
  return colorMap[color as keyof typeof colorMap] || `${type}-muted-foreground`
}

function getCategoryIcon(category: Disposition["category"]) {
  switch (category) {
    case "contact": return <Phone className="w-4 h-4" />
    case "no_contact": return <XCircle className="w-4 h-4" />
    case "outcome": return <CheckCircle className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

function getCategoryLabel(category: Disposition["category"]) {
  switch (category) {
    case "contact": return "Contact Made"
    case "no_contact": return "No Contact"
    case "outcome": return "Positive Outcome"
    default: return "Other"
  }
}

export default function Dispositions() {
  const [dispositions, setDispositions] = useState(mockDispositions)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [editingDisposition, setEditingDisposition] = useState<Disposition | null>(null)
  const [editForm, setEditForm] = useState({
    label: "",
    description: "", 
    color: "",
    category: "" as Disposition["category"]
  })

  const filteredDispositions = dispositions.filter(disp => {
    const matchesSearch = disp.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         disp.key.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || disp.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categoryStats = {
    contact: dispositions.filter(d => d.category === "contact").length,
    no_contact: dispositions.filter(d => d.category === "no_contact").length,
    outcome: dispositions.filter(d => d.category === "outcome").length,
    total: dispositions.length
  }

  const toggleActive = (id: string) => {
    setDispositions(prev => 
      prev.map(disp => 
        disp.id === id ? { ...disp, isActive: !disp.isActive } : disp
      )
    )
  }

  const startEdit = (disposition: Disposition) => {
    setEditingDisposition(disposition)
    setEditForm({
      label: disposition.label,
      description: disposition.description,
      color: disposition.color,
      category: disposition.category
    })
  }

  const cancelEdit = () => {
    setEditingDisposition(null)
    setEditForm({
      label: "",
      description: "",
      color: "",
      category: "contact"
    })
  }

  const saveEdit = () => {
    if (!editingDisposition) return
    
    setDispositions(prev =>
      prev.map(disp =>
        disp.id === editingDisposition.id
          ? {
              ...disp,
              label: editForm.label,
              description: editForm.description,
              color: editForm.color,
              category: editForm.category
            }
          : disp
      )
    )
    cancelEdit()
  }

  return (
    <div className="min-h-screen bg-background p-6 grid grid-rows-[auto_auto_1fr] gap-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              Call Dispositions
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage call outcome codes and agent disposition options
            </p>
          </div>
          <Button className="bg-gradient-accent hover:shadow-accent">
            <Plus className="w-4 h-4 mr-2" />
            New Disposition
          </Button>
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
                  {getCategoryIcon(disposition.category)}
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {disposition.label}
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
                    {getCategoryLabel(disposition.category)}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-foreground">
                    {disposition.usageCount}
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
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value as Disposition["category"] }))}
                >
                  <SelectTrigger className="glass-light border-glass-border focus:ring-accent focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border bg-background z-50">
                    <SelectItem value="contact">Contact Made</SelectItem>
                    <SelectItem value="no_contact">No Contact</SelectItem>
                    <SelectItem value="outcome">Positive Outcome</SelectItem>
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
    </div>
  )
}