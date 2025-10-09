import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Account as ApiAccount, AccountSearchParams, AccountStatistics, CreateAccountRequest, AccountPriority } from "@/types/api"
import { accountService } from "@/services/accounts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Upload, 
  Download, 
  Plus, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Phone,
  MoreHorizontal,
  FileText
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CallHistoryModal } from "../components/CallHistoryModal"

// Legacy interface for backward compatibility - maps to new API Account type
interface Account {
  id: string
  accountId: string
  name: string
  phoneNumbers: string[]
  email?: string
  balance: number
  dueDate: string
  bankPartner: string
  status: "untouched" | "touched" | "ptp" | "collected" | "not_collected"
  agent: string
  lastContact?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

// Helper function to convert API Account to legacy Account interface
const convertApiAccountToLegacy = (apiAccount: ApiAccount): Account => ({
  id: apiAccount.id,
  accountId: apiAccount.accountNumber,
  name: apiAccount.fullName,
  phoneNumbers: [], // Will be populated from phoneNumbers relation
  email: apiAccount.email,
  balance: apiAccount.currentBalance,
  dueDate: apiAccount.createdAt, // Placeholder - adjust as needed
  bankPartner: "Bank", // Placeholder - adjust as needed
  status: apiAccount.status.toLowerCase() as any, // Map API status to legacy
  agent: apiAccount.assignedAgent?.firstName + " " + apiAccount.assignedAgent?.lastName || "Unassigned",
  lastContact: apiAccount.lastContactDate,
  remarks: apiAccount.notes,
  createdAt: apiAccount.createdAt,
  updatedAt: apiAccount.updatedAt
})

// Removed mock data - all data should come from API

function getStatusColor(status: Account["status"]) {
  switch (status) {
    case "untouched": return "bg-destructive/10 text-destructive border-destructive/20"
    case "touched": return "bg-accent/10 text-accent border-accent/20"
    case "ptp": return "bg-warning/10 text-warning border-warning/20"
    case "collected": return "bg-success/10 text-success border-success/20"
    case "not_collected": return "bg-muted/10 text-muted-foreground border-muted/20"
    default: return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getStatusIcon(status: Account["status"]) {
  switch (status) {
    case "untouched": return "🔴"
    case "touched": return "🟢"
    case "ptp": return "✅"
    case "collected": return "💰"
    case "not_collected": return "❌"
    default: return "❓"
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount)
}

export default function Accounts() {
  const [searchParams] = useSearchParams()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBank, setSelectedBank] = useState("all")
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [uploadMode, setUploadMode] = useState<"single" | "bulk">("single")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<AccountStatistics | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showViewDetails, setShowViewDetails] = useState(false)
  const [showEditAccount, setShowEditAccount] = useState(false)
  const [showCallHistory, setShowCallHistory] = useState(false)
  const [showUpdateStatus, setShowUpdateStatus] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  // Function to generate auto account number
  const generateAccountNumber = () => {
    const currentYear = new Date().getFullYear()
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `ACC${currentYear}${currentMonth}${randomNum}`
  }

  // Form state aligned with database schema
  const [singleForm, setSingleForm] = useState({
    accountNumber: "",
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    originalAmount: "",
    currentBalance: "",
    phoneNumber1: "",
    phoneNumber2: "",
    phoneNumber3: "",
    source: "", // Bank/Creditor name (was "banks")
    notes: "", // Region/Branch and other remarks (was "regionBranchName" + "remarks")
    batchId: "", // OD/OPD No. or batch identifier
    preferredContactMethod: "PHONE",
    timezone: "EST",
    language: "EN",
    status: "NEW",
    priority: "MEDIUM"
  })

  // Auto-generate account number when dialog opens
  useEffect(() => {
    if (isDialogOpen && !singleForm.accountNumber) {
      setSingleForm(prev => ({ ...prev, accountNumber: generateAccountNumber() }))
    }
  }, [isDialogOpen])

  // Bank partners list
  const bankPartners = [
    { value: "all", label: "All Banks" },
    { value: "Rcbc", label: "RCBC" },
    { value: "Fundline", label: "Fundline" },
    { value: "Amg", label: "AMG" },
    { value: "Simbayanan", label: "Simbayanan" },
    { value: "Flexi", label: "Flexi" },
    { value: "Tfs", label: "TFS" },
    { value: "JACCS", label: "JACCS" },
    { value: "Radiowealth", label: "Radiowealth" },
    { value: "Ctbc", label: "CTBC" },
    { value: "Ewb", label: "EWB" },
    { value: "Bdo", label: "BDO" }
  ]

  // Load accounts from API
  const loadAccounts = async (params?: AccountSearchParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await accountService.getAccounts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        ...params
      })
      
      const legacyAccounts = response.data.map(convertApiAccountToLegacy)
      setAccounts(legacyAccounts)
      setPagination(response.pagination)
    } catch (err) {
      console.error('Failed to load accounts:', err)
      setError('Failed to load accounts. Please try again.')
      setAccounts([]) // No fallback to mock data
    } finally {
      setLoading(false)
    }
  }

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      const stats = await accountService.getStatistics()
      setStatistics(stats)
    } catch (err) {
      console.error('Failed to load statistics:', err)
    }
  }

  // Export accounts to CSV
  const handleExport = async () => {
    try {
      setIsExporting(true)
      setError(null)
      
      // Use current search and filter parameters for export
      const params: AccountSearchParams = {}
      if (searchQuery) {
        params.search = searchQuery
      }
      // Note: bankPartner filter is handled at the frontend level, not in the API
      
      const response = await accountService.exportAccounts(params)
      
      // Create and download the CSV file
      const blob = new Blob([response.data], { type: response.contentType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = response.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Failed to export accounts:', err)
      setError('Failed to export accounts. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Initialize bank filter from URL params
  useEffect(() => {
    const bankParam = searchParams.get('bank')
    if (bankParam) {
      const bank = bankPartners.find(b => b.value.toLowerCase() === bankParam.toLowerCase())
      if (bank) {
        setSelectedBank(bank.value)
      }
    }
  }, [searchParams])

  // Load initial data
  useEffect(() => {
    loadAccounts()
    loadStatistics()
  }, [])

  // Reload accounts when search or pagination changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadAccounts()
    }, 300) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [searchQuery, pagination.page])

  // Filter accounts by search query and selected bank (local filtering for now)
  useEffect(() => {
    let filtered = accounts

    // Apply bank filter
    if (selectedBank !== "all") {
      filtered = filtered.filter(account => account.bankPartner === selectedBank)
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(account =>
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.accountId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.phoneNumbers.some(phone => phone.includes(searchQuery)) ||
        account.bankPartner.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredAccounts(filtered)
  }, [accounts, searchQuery, selectedBank])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Handle account form submission
  const handleAddAccount = async () => {
    try {
      // Validate required fields
      if (!singleForm.firstName || !singleForm.lastName || !singleForm.originalAmount || !singleForm.currentBalance) {
        alert('Please fill in all required fields (First Name, Last Name, Original Amount, Current Balance)')
        return
      }

      // Prepare account data for API
      const accountData: CreateAccountRequest = {
        accountNumber: singleForm.accountNumber,
        firstName: singleForm.firstName,
        lastName: singleForm.lastName,
        email: singleForm.email || undefined,
        address1: singleForm.address1 || undefined,
        address2: singleForm.address2 || undefined,
        city: singleForm.city || undefined,
        state: singleForm.state || undefined,
        zipCode: singleForm.zipCode || undefined,
        originalAmount: parseFloat(singleForm.originalAmount.replace(/,/g, '')),
        currentBalance: parseFloat(singleForm.currentBalance.replace(/,/g, '')),
        priority: (singleForm.priority as AccountPriority) || 'MEDIUM',
        preferredContactMethod: singleForm.preferredContactMethod || undefined,
        notes: singleForm.notes || undefined
      }

      // Prepare phone numbers array
      const phoneNumbers = []
      if (singleForm.phoneNumber1) phoneNumbers.push({ phoneNumber: singleForm.phoneNumber1, phoneType: 'PRIMARY' })
      if (singleForm.phoneNumber2) phoneNumbers.push({ phoneNumber: singleForm.phoneNumber2, phoneType: 'SECONDARY' })
      if (singleForm.phoneNumber3) phoneNumbers.push({ phoneNumber: singleForm.phoneNumber3, phoneType: 'ALTERNATE' })

      // Create account via API (phone numbers will be handled separately for now)
      const newAccount = await accountService.createAccount(accountData)

      console.log('Account created successfully:', newAccount)
      
      // Close dialog and reset form
      setIsDialogOpen(false)
      setSingleForm({
        accountNumber: "",
        firstName: "",
        lastName: "",
        fullName: "",
        email: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
        originalAmount: "",
        currentBalance: "",
        phoneNumber1: "",
        phoneNumber2: "",
        phoneNumber3: "",
        source: "",
        notes: "",
        batchId: "",
        preferredContactMethod: "PHONE",
        timezone: "EST",
        language: "EN",
        status: "NEW",
        priority: "MEDIUM"
      })

      // Reload accounts to show the new one
      loadAccounts()
      
      // Show success message
      alert('Account added successfully!')
      
    } catch (error) {
      console.error('Failed to create account:', error)
      alert('Failed to create account. Please check the console for details.')
    }
  }

  // Handle dropdown menu actions
  const handleViewDetails = (account: Account) => {
    setSelectedAccount(account)
    setShowViewDetails(true)
  }

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account)
    // Pre-populate edit form with account data
    setSingleForm({
      accountNumber: account.accountId,
      firstName: account.name.split(' ')[0] || '',
      lastName: account.name.split(' ').slice(1).join(' ') || '',
      fullName: account.name,
      email: account.email || '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      originalAmount: account.balance.toString(),
      currentBalance: account.balance.toString(),
      phoneNumber1: account.phoneNumbers[0] || '',
      phoneNumber2: account.phoneNumbers[1] || '',
      phoneNumber3: account.phoneNumbers[2] || '',
      source: account.bankPartner,
      notes: account.remarks || '',
      batchId: '',
      preferredContactMethod: 'PHONE',
      timezone: 'EST',
      language: 'EN',
      status: account.status.toUpperCase(),
      priority: 'MEDIUM'
    })
    setShowEditAccount(true)
  }

  const handleCallHistory = (account: Account) => {
    setSelectedAccount(account)
    setShowCallHistory(true)
  }

  const handleUpdateStatus = (account: Account) => {
    setSelectedAccount(account)
    setShowUpdateStatus(true)
  }

  const handleRemoveAccount = (account: Account) => {
    setSelectedAccount(account)
    setShowRemoveConfirm(true)
  }

  const confirmRemoveAccount = async () => {
    if (!selectedAccount) return
    
    try {
      await accountService.deleteAccount(selectedAccount.id)
      setShowRemoveConfirm(false)
      setSelectedAccount(null)
      loadAccounts()
      alert('Account removed successfully!')
    } catch (error) {
      console.error('Failed to remove account:', error)
      alert('Failed to remove account. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              Account Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage customer accounts and collection status
            </p>
          </div>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="glass-light border-glass-border"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-accent hover:shadow-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dialog border-glass-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Account</DialogTitle>
                  <DialogDescription>
                    Add a new customer account using JDGK CRM format
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account NUMBER</Label>
                      <div className="relative">
                        <Input
                          id="accountNumber"
                          placeholder="Auto-generated"
                          value={singleForm.accountNumber}
                          readOnly
                          className="glass-light border-glass-border bg-muted/30 cursor-not-allowed"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          Auto
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">Banks/Source</Label>
                      <Select
                        value={singleForm.source}
                        onValueChange={(value) => setSingleForm(prev => ({ ...prev, source: value }))}
                      >
                        <SelectTrigger className="glass-light border-glass-border">
                          <SelectValue placeholder="Select bank/creditor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JDGK Bank">JDGK Bank</SelectItem>
                          <SelectItem value="RCBC">RCBC</SelectItem>
                          <SelectItem value="Fundline">Fundline</SelectItem>
                          <SelectItem value="AMG">AMG</SelectItem>
                          <SelectItem value="Simbayanan">Simbayanan</SelectItem>
                          <SelectItem value="Flexi">Flexi</SelectItem>
                          <SelectItem value="TFS">TFS</SelectItem>
                          <SelectItem value="JACCS">JACCS</SelectItem>
                          <SelectItem value="Radiowealth">Radiowealth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        value={singleForm.firstName}
                        onChange={(e) => setSingleForm(prev => ({ 
                          ...prev, 
                          firstName: e.target.value,
                          fullName: `${e.target.value} ${prev.lastName}`.trim()
                        }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Dela Cruz"
                        value={singleForm.lastName}
                        onChange={(e) => setSingleForm(prev => ({ 
                          ...prev, 
                          lastName: e.target.value,
                          fullName: `${prev.firstName} ${e.target.value}`.trim()
                        }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@email.com"
                        value={singleForm.email}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, email: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address1">Address Line 1</Label>
                      <Input
                        id="address1"
                        placeholder="123 Sample Street"
                        value={singleForm.address1}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, address1: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address2">Address Line 2</Label>
                      <Input
                        id="address2"
                        placeholder="Barangay, District"
                        value={singleForm.address2}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, address2: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Quezon City"
                        value={singleForm.city}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, city: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        placeholder="Metro Manila"
                        value={singleForm.state}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, state: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="1100"
                        value={singleForm.zipCode}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, zipCode: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="originalAmount">Original Amount</Label>
                      <Input
                        id="originalAmount"
                        placeholder="500,000.00"
                        value={singleForm.originalAmount}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, originalAmount: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentBalance">Current Balance</Label>
                      <Input
                        id="currentBalance"
                        placeholder="425,000.00"
                        value={singleForm.currentBalance}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber1">Phone Number 1</Label>
                      <Input
                        id="phoneNumber1"
                        placeholder="+63 917 123 4567"
                        value={singleForm.phoneNumber1}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, phoneNumber1: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber2">Phone Number 2</Label>
                      <Input
                        id="phoneNumber2"
                        placeholder="+63 998 765 4321"
                        value={singleForm.phoneNumber2}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, phoneNumber2: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber3">Phone Number 3</Label>
                      <Input
                        id="phoneNumber3"
                        placeholder="+63 929 234 5678"
                        value={singleForm.phoneNumber3}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, phoneNumber3: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={singleForm.status}
                        onValueChange={(value) => setSingleForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="glass-light border-glass-border">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">NEW</SelectItem>
                          <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                          <SelectItem value="CONTACTED">CONTACTED</SelectItem>
                          <SelectItem value="PENDING">PENDING</SelectItem>
                          <SelectItem value="RESOLVED">RESOLVED</SelectItem>
                          <SelectItem value="CLOSED">CLOSED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={singleForm.priority}
                        onValueChange={(value) => setSingleForm(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger className="glass-light border-glass-border">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">LOW</SelectItem>
                          <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                          <SelectItem value="URGENT">URGENT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batchId">Batch/OD No.</Label>
                      <Input
                        id="batchId"
                        placeholder="BATCH001 or OD12345"
                        value={singleForm.batchId}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, batchId: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes/Remarks</Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes, region/branch info, and remarks..."
                      value={singleForm.notes}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="glass-light border-glass-border"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false)
                    // Reset form to initial state
                    setSingleForm({
                      accountNumber: "",
                      firstName: "",
                      lastName: "",
                      fullName: "",
                      email: "",
                      address1: "",
                      address2: "",
                      city: "",
                      state: "",
                      zipCode: "",
                      country: "US",
                      originalAmount: "",
                      currentBalance: "",
                      phoneNumber1: "",
                      phoneNumber2: "",
                      phoneNumber3: "",
                      source: "",
                      notes: "",
                      batchId: "",
                      preferredContactMethod: "PHONE",
                      timezone: "EST",
                      language: "EN",
                      status: "NEW",
                      priority: "MEDIUM"
                    })
                  }}>
                    Cancel
                  </Button>
                  <Button className="bg-gradient-accent hover:shadow-accent" onClick={handleAddAccount}>
                    Add Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
              <DialogContent className="glass-dialog border-glass-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Account Details</DialogTitle>
                  <DialogDescription>
                    View detailed information for {selectedAccount?.name}
                  </DialogDescription>
                </DialogHeader>
                {selectedAccount && (
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Account Number</Label>
                        <p className="text-sm text-muted-foreground">{selectedAccount.accountId}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Name</Label>
                        <p className="text-sm text-muted-foreground">{selectedAccount.name}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Email</Label>
                        <p className="text-sm text-muted-foreground">{selectedAccount.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Balance</Label>
                        <p className="text-sm text-muted-foreground">₱{selectedAccount.balance.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Bank Partner</Label>
                        <p className="text-sm text-muted-foreground">{selectedAccount.bankPartner}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Status</Label>
                        <Badge variant={selectedAccount.status === 'collected' ? 'default' : 'secondary'}>
                          {selectedAccount.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Phone Numbers</Label>
                      <div className="space-y-1">
                        {selectedAccount.phoneNumbers.map((phone, index) => (
                          <p key={index} className="text-sm text-muted-foreground">{phone}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Assigned Agent</Label>
                      <p className="text-sm text-muted-foreground">{selectedAccount.agent}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Last Contact</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedAccount.lastContact ? new Date(selectedAccount.lastContact).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Remarks</Label>
                      <p className="text-sm text-muted-foreground">{selectedAccount.remarks || 'No remarks'}</p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowViewDetails(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Account Dialog */}
            <Dialog open={showEditAccount} onOpenChange={setShowEditAccount}>
              <DialogContent className="glass-dialog border-glass-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Account</DialogTitle>
                  <DialogDescription>
                    Update account information for {selectedAccount?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editAccountNumber">Account NUMBER</Label>
                      <div className="relative">
                        <Input
                          id="editAccountNumber"
                          placeholder="Auto-generated"
                          value={singleForm.accountNumber}
                          readOnly
                          className="glass-light border-glass-border bg-muted/30 cursor-not-allowed"
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          Auto
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editSource">Source/Bank</Label>
                      <Input
                        id="editSource"
                        placeholder="Bank/Creditor name"
                        value={singleForm.source}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, source: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">First Name</Label>
                      <Input
                        id="editFirstName"
                        placeholder="Juan"
                        value={singleForm.firstName}
                        onChange={(e) => setSingleForm(prev => ({ 
                          ...prev, 
                          firstName: e.target.value,
                          fullName: `${e.target.value} ${prev.lastName}`.trim()
                        }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLastName">Last Name</Label>
                      <Input
                        id="editLastName"
                        placeholder="Dela Cruz"
                        value={singleForm.lastName}
                        onChange={(e) => setSingleForm(prev => ({ 
                          ...prev, 
                          lastName: e.target.value,
                          fullName: `${prev.firstName} ${e.target.value}`.trim()
                        }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editOriginalAmount">Original Amount</Label>
                      <Input
                        id="editOriginalAmount"
                        placeholder="500,000.00"
                        value={singleForm.originalAmount}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, originalAmount: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editCurrentBalance">Current Balance</Label>
                      <Input
                        id="editCurrentBalance"
                        placeholder="425,000.00"
                        value={singleForm.currentBalance}
                        onChange={(e) => setSingleForm(prev => ({ ...prev, currentBalance: e.target.value }))}
                        className="glass-light border-glass-border"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editNotes">Notes/Remarks</Label>
                    <Textarea
                      id="editNotes"
                      placeholder="Additional notes and remarks..."
                      value={singleForm.notes}
                      onChange={(e) => setSingleForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="glass-light border-glass-border"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditAccount(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-gradient-accent hover:shadow-accent" onClick={async () => {
                    if (!selectedAccount) {
                      console.log('No selected account')
                      return
                    }
                    
                    console.log('Starting account update...', selectedAccount.id)
                    console.log('Form data:', singleForm)
                    
                    try {
                      const updateData = {
                        firstName: singleForm.firstName,
                        lastName: singleForm.lastName,
                        email: singleForm.email || undefined,
                        currentBalance: parseFloat(singleForm.currentBalance.replace(/,/g, '')),
                        notes: singleForm.notes || undefined
                      }
                      
                      console.log('Update data:', updateData)
                      console.log('About to call accountService.updateAccount with ID:', selectedAccount.id.toString())
                      const result = await accountService.updateAccount(selectedAccount.id.toString(), updateData)
                      console.log('Update result:', result)
                      
                      alert('Account updated successfully!')
                      setShowEditAccount(false)
                      setSelectedAccount(null)
                      loadAccounts()
                    } catch (error) {
                      console.error('Failed to update account:', error)
                      console.error('Error response:', error.response?.data)
                      console.error('Error status:', error.response?.status)
                      alert(`Failed to update account: ${error.response?.data?.message || error.message || error}`)
                    }
                  }}>
                    Update Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Call History Modal */}
            {selectedAccount && (
              <CallHistoryModal
                open={showCallHistory}
                onOpenChange={setShowCallHistory}
                accountId={selectedAccount.id}
                accountName={selectedAccount.name}
              />
            )}

            {/* Update Status Dialog */}
            <Dialog open={showUpdateStatus} onOpenChange={setShowUpdateStatus}>
              <DialogContent className="glass-dialog border-glass-border">
                <DialogHeader>
                  <DialogTitle>Update Status</DialogTitle>
                  <DialogDescription>
                    Update the status for {selectedAccount?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Current Status</Label>
                    <Badge variant="secondary" className="w-fit">
                      {selectedAccount?.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newStatus">New Status</Label>
                    <Select defaultValue={selectedAccount?.status}>
                      <SelectTrigger className="glass-light border-glass-border">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="untouched">UNTOUCHED</SelectItem>
                        <SelectItem value="touched">TOUCHED</SelectItem>
                        <SelectItem value="ptp">PROMISE TO PAY</SelectItem>
                        <SelectItem value="collected">COLLECTED</SelectItem>
                        <SelectItem value="not_collected">NOT COLLECTED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="statusNotes">Status Notes</Label>
                    <Textarea
                      id="statusNotes"
                      placeholder="Add notes about the status change..."
                      className="glass-light border-glass-border"
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUpdateStatus(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-gradient-accent hover:shadow-accent" onClick={() => {
                    // TODO: Implement status update API call
                    alert('Status updated successfully!')
                    setShowUpdateStatus(false)
                    loadAccounts()
                  }}>
                    Update Status
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Remove Account Confirmation Dialog */}
            <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
              <DialogContent className="glass-dialog border-glass-border">
                <DialogHeader>
                  <DialogTitle>Remove Account</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this account? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                
                {selectedAccount && (
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="font-semibold text-destructive">Account to be removed:</p>
                          <p className="text-sm">{selectedAccount.name} ({selectedAccount.accountId})</p>
                          <p className="text-sm">Balance: ₱{selectedAccount.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={confirmRemoveAccount}>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Remove Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="glass-light border-glass-border focus:ring-accent focus:border-accent max-w-md"
          />
          
          {/* Bank Filter */}
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger className="w-full sm:w-48 glass-light border-glass-border">
              <SelectValue placeholder="Filter by Bank" />
            </SelectTrigger>
            <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
              {bankPartners.map((bank) => (
                <SelectItem key={bank.value} value={bank.value} className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                  {bank.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accounts
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {loading ? '...' : statistics?.totalAccounts || filteredAccounts.length}
            </div>
            <p className="text-xs text-muted-foreground">Total in system</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Accounts
            </CardTitle>
            <Phone className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {loading ? '...' : statistics?.accountsByStatus?.active || filteredAccounts.filter(a => a.status === "touched").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Untouched Accounts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {loading ? '...' : statistics?.accountsByStatus?.new || filteredAccounts.filter(a => a.status === "untouched").length}
            </div>
            <p className="text-xs text-muted-foreground">Pending contact</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {loading ? '...' : formatCurrency(statistics?.financialMetrics?.totalBalance || filteredAccounts.reduce((sum, account) => sum + account.balance, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Total owed</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Account List</CardTitle>
          <CardDescription>
            Manage customer accounts and track collection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone Numbers</TableHead>
                <TableHead>Bank Partner</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                // Error state
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="text-red-500 mb-2">{error}</div>
                    <Button 
                      onClick={() => loadAccounts()} 
                      variant="outline"
                      size="sm"
                    >
                      Try Again
                    </Button>
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No accounts found
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                filteredAccounts.map((account, index) => (
                  <TableRow 
                    key={account.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                  <TableCell>
                    <div className="font-mono text-sm font-bold text-accent">{account.accountId}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{account.name}</div>
                      {account.email && <div className="text-xs text-muted-foreground">{account.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {account.phoneNumbers.map((phone, idx) => (
                        <div key={idx} className="font-mono text-sm flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                          {phone}
                          {idx === 0 && account.phoneNumbers.length > 1 && (
                            <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{account.bankPartner}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono font-bold text-foreground">
                      {formatCurrency(account.balance)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(account.status)}>
                      <span className="mr-1">{getStatusIcon(account.status)}</span>
                      {account.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{account.dueDate}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{account.agent}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="outline" size="sm" className="glass-light">
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-dropdown">
                          <DropdownMenuItem onClick={() => handleViewDetails(account)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                            Edit Account
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCallHistory(account)}>
                            Call History
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(account)}>
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveAccount(account)}>
                            Remove Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredAccounts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Accounts Found</h3>
              <p className="text-muted-foreground mb-4">
                No accounts match your search criteria.
              </p>
              <Button className="bg-gradient-accent hover:shadow-accent">
                <Plus className="w-4 h-4 mr-2" />
                Add New Account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}