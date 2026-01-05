import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Account as ApiAccount, AccountSearchParams, AccountStatistics, CreateAccountRequest, AccountPriority } from "@/types/api"
import { accountService } from "@/services/accounts"
import { vicidialService, VicidialCampaign, RealtimeReport } from "@/services/vicidial"
import { usersService, User } from "@/services/users"
import { auth } from "@/services/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
import {
  Upload,
  Download,
  Plus,
  Users,
  DollarSign,
  AlertTriangle,
  Phone,
  MoreHorizontal,
  FileText,
  RefreshCw
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CallHistoryModal } from "../components/CallHistoryModal"
import { useToast } from "@/hooks/use-toast"
import { dispositionsService, Disposition } from "@/services/dispositions"

// Legacy interface for backward compatibility - maps to new API Account type
interface Account {
  id: string
  accountId: string
  name: string
  phoneNumbers: string[]
  email?: string
  address?: string
  originalAmount?: number
  balance: number
  dueDate: string
  bankPartner: string
  status: "untouched" | "touched" | "ptp" | "collected" | "not_collected"
  secondaryStatus?: string
  agent: string
  lastContact?: string
  remarks?: string
  createdAt: string
  updatedAt: string
  assignedDate?: string
}

// Helper function to convert API Account to legacy Account interface
const convertApiAccountToLegacy = (apiAccount: ApiAccount): Account => {
  // Map API status to legacy status safely
  let status: Account["status"] = "untouched";
  if (apiAccount.status) {
    const s = apiAccount.status.toUpperCase();
    switch (s) {
      case 'NEW': status = 'untouched'; break;
      case 'ACTIVE': status = 'touched'; break;
      case 'PTP': status = 'ptp'; break;
      case 'PAID': status = 'collected'; break;
      case 'SKIP': status = 'not_collected'; break;
      default: status = 'untouched';
    }
  }

  // Construct full address
  const addressParts = [
    apiAccount.address1,
    apiAccount.address2,
    apiAccount.city,
    apiAccount.state,
    apiAccount.zipCode,
    apiAccount.country
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : undefined;

  return {
    id: apiAccount.id,
    accountId: apiAccount.accountNumber,
    name: apiAccount.fullName || "Unknown Name",
    phoneNumbers: apiAccount.phoneNumbers?.map(p => p.phoneNumber) || [],
    email: apiAccount.email,
    address: fullAddress,
    originalAmount: apiAccount.originalAmount,
    balance: apiAccount.currentBalance || 0,
    dueDate: apiAccount.createdAt, // Placeholder - adjust as needed
    bankPartner: apiAccount.source || "Unknown Bank",
    status: status,
    secondaryStatus: apiAccount.secondaryStatus,
    agent: apiAccount.assignedAgent ? (apiAccount.assignedAgent.firstName + " " + apiAccount.assignedAgent.lastName) : "Unassigned",
    assignedDate: apiAccount.assignedDate,
    lastContact: apiAccount.lastContactDate,
    remarks: apiAccount.notes,
    createdAt: apiAccount.createdAt,
    updatedAt: apiAccount.updatedAt
  };
}

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

import { useAgentStatus } from "@/hooks/useAgentStatus"
import { CurrentCallCard } from "@/components/vicidial/CurrentCallCard"

export default function Accounts() {

  const [searchParams, setSearchParams] = useSearchParams()
  // Use shared agent status hook
  const {
    status: agentStatus,
    callInfo,
    activeAccount: activeCallAccount,
    accountLoading: activeCallLoading,
    updateStatus: updateAgentStatus
  } = useAgentStatus()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [campaigns, setCampaigns] = useState<VicidialCampaign[]>([])
  const [agents, setAgents] = useState<User[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all")
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt_desc")
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusNotes, setStatusNotes] = useState<string>("")
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
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null)
  const [bulkUploadCampaignId, setBulkUploadCampaignId] = useState<string>("")
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0)
  const [bulkUploadOptions, setBulkUploadOptions] = useState({
    skipErrors: false,
    updateExisting: false
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  })
  const [dispositions, setDispositions] = useState<Disposition[]>([])
  const { toast } = useToast()
  const [activeLivePhones, setActiveLivePhones] = useState<Set<string>>(new Set())
  const [pinnedAccounts, setPinnedAccounts] = useState<Account[]>([]) // Store accounts fetched specifically for pinning
  const user = auth.getUser()
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN'

  // Poll for real-time status to pin active calls
  useEffect(() => {
    const pollRealtime = async () => {
      try {
        const report = await vicidialService.getRealtimeReport();
        // Collect all phone numbers that are currently INCALL, LIVE, etc.
        const livePhones = new Set<string>();

        // Checks agents in call
        report.agents?.forEach(agent => {
          if (['INCALL', 'LIVE', 'XFER'].includes(agent.status)) {
            // We might need to find the phone number from the agent's channel or lead
          }
        });

        // report.calls gives us the live calls directly
        report.calls?.forEach(call => {
          if (call.phone_number) livePhones.add(call.phone_number);
        });

        setActiveLivePhones(livePhones);

        // Role-Based Injection: If Admin/Manager, check for "off-list" active calls and fetch them
        if (isManagerOrAdmin && livePhones.size > 0) {
          // Identify numbers that are NOT in the current accounts list
          const existingPhones = new Set<string>();
          accounts.forEach(acc => acc.phoneNumbers.forEach(p => existingPhones.add(p)));

          const missingPhones = Array.from(livePhones).filter(p => !existingPhones.has(p));

          if (missingPhones.length > 0) {
            try {
              // Fetch the missing accounts to inject them
              const accountsResponse = await accountService.getAccounts({
                phoneNumbers: missingPhones,
                limit: missingPhones.length
              });

              if (accountsResponse.data && accountsResponse.data.length > 0) {
                // Convert to legacy and set pinned state
                const newPinned = accountsResponse.data.map(convertApiAccountToLegacy);

                // Avoid infinite re-renders or duplicates if we already have them pin-cached
                // For simplicity, just update the state. The merge logic below handles display.
                setPinnedAccounts(prev => {
                  // Only update if different to avoid excess re-renders? 
                  // Actually, simpler to just set it, React will diff.
                  return newPinned;
                });
              }
            } catch (fetchErr) {
              console.error("Failed to fetch active injection accounts", fetchErr);
            }
          } else {
            // If all active phones are already in list, clear pinned accounts to keep clean?
            // Or keep them? If they are in `accounts`, we don't need them in `pinnedAccounts`.
            setPinnedAccounts([]);
          }
        } else {
          setPinnedAccounts([]);
        }

      } catch (err) {
        console.error(err);
      }
    };

    pollRealtime();
    const interval = setInterval(pollRealtime, 5000);
    return () => clearInterval(interval);
  }, [accounts, isManagerOrAdmin]); // Added dependency on accounts to know what's missing

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

  // Handle Screen Pop (Deep Linking)
  useEffect(() => {
    const handleScreenPop = async () => {
      const mode = searchParams.get('mode');
      const accountId = searchParams.get('accountId');

      if (mode === 'view' && accountId) {
        // Fetch specific account if not in current list
        try {
          // We can reuse getAccount logic or just fetch detail
          // For now, simpler to rely on loadAccounts filtering if ID is in list, 
          // but robust way is to fetch specific account.
          // Let's check if it's already in 'accounts' state first
          const existing = accounts.find(a => a.id === accountId);
          if (existing) {
            handleViewDetails(existing);
          } else {
            // Need to fetch it individually or search for it
            const response = await accountService.getAccounts({ search: accountId, limit: 1 });
            if (response.data && response.data.length > 0) {
              const foundAccount = convertApiAccountToLegacy(response.data[0]);
              handleViewDetails(foundAccount);
            }
          }
        } catch (err) {
          console.error("Screen Pop Error: Failed to load account", err);
        }
      } else if (mode === 'create') {
        const phone = searchParams.get('phone');
        const accountNumber = searchParams.get('accountNumber');
        const campaignId = searchParams.get('campaignId');

        setIsDialogOpen(true);
        setSingleForm(prev => ({
          ...prev,
          phoneNumber1: phone || prev.phoneNumber1,
          accountNumber: accountNumber || generateAccountNumber(), // Use provided ID or generate new
          notes: campaignId ? `Lead from Campaign: ${campaignId}` : prev.notes
        }));
      }
    };

    // Small delay to ensure initial load doesn't conflict
    const timer = setTimeout(() => {
      handleScreenPop();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams, accounts]); // Depend on accounts to ensure list is loaded (though we fetch if missing)


  // Sort options
  const sortOptions = [
    { value: "createdAt_desc", label: "Date (Newest)" },
    { value: "createdAt_asc", label: "Date (Oldest)" },
    { value: "lastName_asc", label: "Name (A-Z)" },
    { value: "lastName_desc", label: "Name (Z-A)" },
    { value: "status_asc", label: "Status (A-Z)" },
    { value: "status_desc", label: "Status (Z-A)" },
  ]

  // Status options
  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "NEW", label: "New" },
    { value: "ACTIVE", label: "Active" },
    { value: "PTP", label: "PTP" },
    { value: "PAID", label: "Paid" },
    { value: "SKIP", label: "Skip" },
  ]

  // Load accounts from API
  const loadAccounts = async (params?: AccountSearchParams) => {
    try {
      setLoading(true)
      setError(null)

      const [sortField, sortOrder] = sortBy.split('_')

      const response = await accountService.getAccounts({
        page: pagination.page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        campaignId: selectedCampaignId !== "all" ? selectedCampaignId : undefined,
        agentId: selectedAgentId !== "all" ? selectedAgentId : undefined,
        status: selectedStatus !== "all" ? selectedStatus as any : undefined,
        sortBy: sortField as any,
        sortOrder: sortOrder as any,
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
      const params: AccountSearchParams = {
        campaignId: selectedCampaignId !== "all" ? selectedCampaignId : undefined,
        agentId: selectedAgentId !== "all" ? selectedAgentId : undefined,
        status: selectedStatus !== "all" ? selectedStatus as any : undefined,
      }
      const stats = await accountService.getStatistics(params)
      setStatistics(stats)
    } catch (err) {
      console.error('Failed to load statistics:', err)
    }
  }

  // Fetch campaigns and agents
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await vicidialService.getCampaigns()
        setCampaigns(data)
      } catch (error) {
        console.error("Failed to fetch campaigns", error)
      }
    }

    const fetchAgents = async () => {
      try {
        const data = await usersService.getUsers(0, 1000)
        // Filter only agents if needed, but for now show all users
        setAgents(data)
      } catch (error) {
        console.error("Failed to fetch agents", error)
      }
    }

    fetchCampaigns()
    fetchAgents()
  }, [])

  // Export accounts to CSV

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

  const handleSyncVicidial = async () => {
    try {
      setLoading(true)
      const result = await accountService.syncVicidialLeads(selectedCampaignId)
      alert(`Synced ${result.created + result.updated} leads from Vicidial.`)
      loadAccounts()
    } catch (error) {
      console.error("Failed to sync Vicidial leads:", error)
      alert("Failed to sync Vicidial leads. Please check the console for details.")
    } finally {
      setLoading(false)
    }
  }

  const loadDispositions = async () => {
    try {
      const data = await dispositionsService.getDispositions(true)
      setDispositions(data)
    } catch (error) {
      console.error("Failed to load dispositions", error)
    }
  }

  // Initialize
  useEffect(() => {
    loadAccounts()
    loadStatistics()
    loadDispositions()
  }, [])

  // Reload accounts when search or pagination changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadAccounts()
      loadStatistics()
    }, 300) // Debounce search

    return () => clearTimeout(delayedSearch)
  }, [searchQuery, pagination.page, selectedCampaignId, selectedAgentId, selectedStatus, sortBy])

  // Filter accounts by search query and Sort by Active Status
  useEffect(() => {
    // 0. Merge regular accounts with pinned accounts (deduplicating by ID)
    const allAccountsMap = new Map<string, Account>();

    // First add regular accounts
    accounts.forEach(acc => allAccountsMap.set(acc.id, acc));

    // Then add/overwrite with pinned accounts (ensure they exist in the set)
    // Actually, pinnedAccounts are for "Off-List" injection.
    // If an account is in both, we use the `accounts` version usually, but pinned one is fresh. 
    // Let's prioritize existing list to avoid UI jumpiness if data differs slightly, 
    // unless it's purely missing.
    pinnedAccounts.forEach(acc => {
      if (!allAccountsMap.has(acc.id)) {
        allAccountsMap.set(acc.id, acc);
      }
    });

    let result = Array.from(allAccountsMap.values());

    // 1. Filter by Search (Frontend filter if search query is present but not handled by API reload)
    // Actually, `loadAccounts` is triggered by `searchQuery`, so backend handles primary search.
    // But `pinnedAccounts` might need filtering if they don't match query?
    // User requested "Inject ANY active call", so pinned accounts should probably stay visible even if they match query or not?
    // "Pin Active Calls" implies visibility. Let's keep them unless explicitly filtered out?
    // Standard behavior: Pinned items usually bypass filters or we just let them be subject to same filters.
    // Given "Inject" requirement, let's keep them subject to SEARCH but maybe ignore status filters?
    // For now, let's apply frontend filtering to the merged list to be safe.

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(account =>
        account.name.toLowerCase().includes(lowerQuery) ||
        account.accountId.toLowerCase().includes(lowerQuery) ||
        account.phoneNumbers?.some(p => p.includes(lowerQuery)) ||
        account.email?.toLowerCase().includes(lowerQuery)
      )
    }

    // 4. Sort
    result.sort((a, b) => {
      // Primary Sort: Active Calls (Pin to Top)
      const aIsActive = a.phoneNumbers.some(p => activeLivePhones.has(p));
      const bIsActive = b.phoneNumbers.some(p => activeLivePhones.has(p));
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // Secondary Sort: Selected Sort Option
      switch (sortBy) {
        case "currentBalance_desc": // Amount High to Low
          return b.balance - a.balance;
        case "currentBalance_asc": // Amount Low to High
          return a.balance - b.balance;
        case "accountNumber_asc": // Account ID A-Z
          return a.accountId.localeCompare(b.accountId);
        case "accountNumber_desc": // Account ID Z-A
          return b.accountId.localeCompare(a.accountId);
        case "firstName_asc":
          return a.name.localeCompare(b.name)
        case "createdAt_desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "updatedAt_desc":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })

    setFilteredAccounts(result)
  }, [accounts, pinnedAccounts, activeLivePhones, sortBy, searchQuery])

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

      // Add phone numbers to account data
      if (phoneNumbers.length > 0) {
        accountData.phoneNumbers = phoneNumbers;
      }

      // Create account via API
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

  const handleManualCall = async (account: Account) => {
    try {
      // Get current user
      const currentUser = await auth.getCurrentUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Get the primary phone number
      const phoneNumber = account.phoneNumbers[0]
      if (!phoneNumber) {
        throw new Error('No phone number available for this account')
      }

      // Initiate the call
      await vicidialService.dial(phoneNumber, currentUser.email, account.id)

      // Show success toast
      alert(`Calling ${phoneNumber}...`)
    } catch (error: any) {
      console.error('Failed to initiate call:', error)
      alert(`Failed to initiate call: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUpdateStatus = (account: Account) => {
    setSelectedAccount(account)
    setNewStatus(account.status)
    setStatusNotes("")
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
              onClick={handleSyncVicidial}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Vicidial
            </Button>
            <Button
              variant="outline"
              className="glass-light border-glass-border"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </Button>
            <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-accent hover:shadow-accent">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-dialog border-glass-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Accounts</DialogTitle>
                  <DialogDescription>
                    Upload multiple accounts at once using CSV or Excel file (up to 10MB)
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* File Upload Area */}
                  <div
                    className="border-2 border-dashed border-glass-border rounded-lg p-8 text-center hover:border-accent hover:bg-accent/5 transition-all cursor-pointer group"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-accent', 'bg-accent/5')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-accent', 'bg-accent/5')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-accent', 'bg-accent/5')
                      const files = e.dataTransfer.files
                      if (files.length > 0) {
                        const file = files[0]
                        if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                          setBulkUploadFile(file)
                        } else {
                          alert('Please upload a CSV or Excel file')
                        }
                      }
                    }}
                    onClick={() => document.getElementById('bulk-file-input')?.click()}
                  >
                    <input
                      id="bulk-file-input"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          setBulkUploadFile(e.target.files[0])
                        }
                      }}
                    />
                    <Upload className="w-12 h-12 text-muted-foreground group-hover:text-accent mx-auto mb-2 transition-colors" />
                    {bulkUploadFile ? (
                      <div>
                        <p className="font-semibold text-foreground">{bulkUploadFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(bulkUploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-foreground">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">CSV or Excel files up to 10MB</p>
                      </div>
                    )}
                  </div>

                  {/* Campaign Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="bulk-campaign">Campaign (Optional)</Label>
                    <Select value={bulkUploadCampaignId || "none"} onValueChange={(value) => setBulkUploadCampaignId(value === "none" ? "" : value)}>
                      <SelectTrigger className="glass-light border-glass-border">
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Campaign</SelectItem>
                        {campaigns.map((campaign) => (
                          <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                            {campaign.campaign_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Upload Options */}
                  <div className="space-y-3">
                    <Label>Upload Options</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="skip-errors"
                        checked={bulkUploadOptions.skipErrors}
                        onChange={(e) =>
                          setBulkUploadOptions((prev) => ({
                            ...prev,
                            skipErrors: e.target.checked
                          }))
                        }
                        className="w-4 h-4 rounded border-glass-border"
                      />
                      <Label htmlFor="skip-errors" className="text-sm font-normal cursor-pointer">
                        Skip rows with errors (continue with valid rows)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="update-existing"
                        checked={bulkUploadOptions.updateExisting}
                        onChange={(e) =>
                          setBulkUploadOptions((prev) => ({
                            ...prev,
                            updateExisting: e.target.checked
                          }))
                        }
                        className="w-4 h-4 rounded border-glass-border"
                      />
                      <Label htmlFor="update-existing" className="text-sm font-normal cursor-pointer">
                        Update existing accounts (if account number already exists)
                      </Label>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isBulkUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uploading...</span>
                        <span className="text-foreground font-semibold">{bulkUploadProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-accent h-full transition-all duration-300"
                          style={{ width: `${bulkUploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkUpload(false)
                      setBulkUploadFile(null)
                      setBulkUploadCampaignId("")
                      setBulkUploadProgress(0)
                    }}
                    disabled={isBulkUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-accent hover:shadow-accent"
                    onClick={async () => {
                      if (!bulkUploadFile) {
                        alert("Please select a file to upload")
                        return
                      }

                      setIsBulkUploading(true)
                      setBulkUploadProgress(0)

                      try {
                        const interval = setInterval(() => {
                          setBulkUploadProgress((prev) => {
                            if (prev >= 90) return 90
                            return prev + 10
                          })
                        }, 500)

                        const response = await accountService.bulkUpload({
                          file: bulkUploadFile,
                          campaignId: bulkUploadCampaignId || undefined,
                          skipDuplicates: bulkUploadOptions.skipErrors,
                          updateExisting: bulkUploadOptions.updateExisting
                        })

                        clearInterval(interval)
                        setBulkUploadProgress(100)

                        const result = response.data || (response as any)

                        if (response.success && result) {
                          let message = ""
                          if (result.failedRecords > 0) {
                            message = `Upload completed with ${result.successfulRecords} successful records and ${result.failedRecords} errors.`
                          } else {
                            message = `Upload successful! ${result.successfulRecords} records imported.`
                          }
                          alert(message)

                          // Reset form and close dialog
                          setShowBulkUpload(false)
                          setBulkUploadFile(null)
                          setBulkUploadCampaignId("")
                          setBulkUploadProgress(0)
                          setBulkUploadOptions({ skipErrors: false, updateExisting: false })

                          // Reload accounts
                          loadAccounts()
                        } else {
                          alert(response.message || "Upload failed")
                        }
                      } catch (error) {
                        console.error("Upload error:", error)
                        alert(`Upload failed: ${error.message || "Unknown error"}`)
                      } finally {
                        setIsBulkUploading(false)
                      }
                    }}
                    disabled={!bulkUploadFile || isBulkUploading}
                  >
                    {isBulkUploading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                        <Label className="text-sm font-semibold">Address</Label>
                        <p className="text-sm text-muted-foreground">{selectedAccount.address || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Original Amount</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedAccount.originalAmount ? `₱${selectedAccount.originalAmount.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Out Standing Balance (OSB)</Label>
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
                        <div className="flex gap-2">
                          <Badge variant={selectedAccount.status === 'collected' ? 'default' : 'secondary'}>
                            {selectedAccount.status.toUpperCase()}
                          </Badge>
                          {selectedAccount.secondaryStatus && (
                            <Badge variant="outline">{selectedAccount.secondaryStatus}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Phone Numbers</Label>
                      <div className="space-y-1">
                        {selectedAccount.phoneNumbers.length > 0 ? (
                          selectedAccount.phoneNumbers.map((phone, index) => (
                            <p key={index} className="text-sm text-muted-foreground">{phone}</p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No phone numbers</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Remarks</Label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAccount.remarks || 'No remarks'}</p>
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

                      return
                    }



                    try {
                      const updateData = {
                        firstName: singleForm.firstName,
                        lastName: singleForm.lastName,
                        email: singleForm.email || undefined,
                        currentBalance: parseFloat(singleForm.currentBalance.replace(/,/g, '')),
                        notes: singleForm.notes || undefined
                      }


                      const result = await accountService.updateAccount(selectedAccount.id.toString(), updateData)


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
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="w-fit">
                        {selectedAccount?.status.toUpperCase()}
                      </Badge>
                      {selectedAccount?.secondaryStatus && (
                        <Badge variant="outline" className="w-fit">
                          {selectedAccount.secondaryStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newStatus">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="glass-light border-glass-border">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">NEW / UNTOUCHED</SelectItem>
                        <SelectItem value="ACTIVE">ACTIVE / TOUCHED</SelectItem>
                        <SelectItem value="PTP">PROMISE TO PAY</SelectItem>
                        <SelectItem value="PAID">PAID / COLLECTED</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                        <SelectItem value="SKIP">SKIP / NOT COLLECTED</SelectItem>

                        {dispositions.length > 0 && <SelectSeparator className="my-2" />}
                        {dispositions.map(d => (
                          <SelectItem key={d.id} value={d.newAccountStatus || d.code}>
                            {d.name} ({d.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="statusNotes">Status Notes</Label>
                    <Textarea
                      id="statusNotes"
                      placeholder="Add notes about the status change..."
                      className="glass-light border-glass-border"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUpdateStatus(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-gradient-accent hover:shadow-accent" onClick={async () => {
                    if (!selectedAccount) return
                    try {
                      await accountService.updateAccount(selectedAccount.id.toString(), {
                        status: newStatus as any, // Cast to any or AccountStatus logic
                        notes: statusNotes
                      })
                      toast({
                        title: "Status updated",
                        description: "Account status has been updated successfully."
                      })
                      setShowUpdateStatus(false)
                      loadAccounts()
                    } catch (error) {
                      console.error('Failed to update status:', error)
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to update status"
                      })
                    }
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="glass-light border-glass-border pl-10"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            {/* Agent Filter */}
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="w-full sm:w-48 glass-light border-glass-border">
                <SelectValue placeholder="Filter by Agent" />
              </SelectTrigger>
              <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id} className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                    {agent.firstName} {agent.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48 glass-light border-glass-border">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value} className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Campaign Filter */}
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-full sm:w-48 glass-light border-glass-border">
                <SelectValue placeholder="Filter by Campaign" />
              </SelectTrigger>
              <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
                <SelectItem value="all">All Campaigns</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.campaign_id} value={campaign.campaign_id} className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                    {campaign.campaign_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 glass-light border-glass-border">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-glass-medium/95 backdrop-blur-md border-glass-border z-50">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="hover:bg-glass-light/30 focus:bg-glass-light/30">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              {loading ? '...' : formatCurrency(statistics?.totalBalance || filteredAccounts.reduce((sum, account) => sum + account.balance, 0))}
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
                <TableHead>Secondary Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Assigned Date</TableHead>
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
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                // Error state
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
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
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
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
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-foreground">{account.name}</span>
                        <span className="text-xs text-muted-foreground">{account.accountId}</span>
                        {account.phoneNumbers.some(p => activeLivePhones.has(p)) && (
                          <Badge variant="destructive" className="w-fit mt-1 text-[10px] px-1 py-0 h-5">
                            IN CALL
                          </Badge>
                        )}
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
                      <div className="text-sm font-medium text-muted-foreground">
                        {account.secondaryStatus || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{account.dueDate}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{account.agent}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {account.assignedDate ? new Date(account.assignedDate).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-light"
                          onClick={() => handleManualCall(account)}
                        >
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
        <CardFooter className="flex items-center justify-between space-x-2 py-4 border-t border-border/40 bg-muted/5">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAccounts({ page: pagination.page - 1 })}
              disabled={pagination.page <= 1 || loading}
            >
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {pagination.page} of {pagination.totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAccounts({ page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}