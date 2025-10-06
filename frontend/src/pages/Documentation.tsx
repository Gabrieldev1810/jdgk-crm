import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  BookOpen,
  Home, 
  Users, 
  Phone, 
  FileText, 
  BarChart3, 
  Settings, 
  Shield,
  Headphones,
  Database,
  Upload,
  Info,
  Star,
  CheckCircle,
  User,
  Activity
} from "lucide-react"

interface PageDocumentation {
  id: string
  title: string
  icon: typeof Home
  roles: string[]
  description: string
  features: string[]
  usage: string[]
  keyFunctionalities: string[]
}

const pagesDocumentation: PageDocumentation[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Home,
    roles: ["admin", "manager", "agent"],
    description: "Main overview page showing key metrics and performance indicators for your debt collection operations.",
    features: [
      "Real-time performance metrics",
      "Collection statistics",
      "Daily/weekly/monthly summaries",
      "Quick navigation to other modules",
      "Role-based dashboard variants"
    ],
    usage: [
      "Monitor overall collection performance",
      "Track team productivity",
      "View daily goals and achievements",
      "Access quick actions for common tasks"
    ],
    keyFunctionalities: [
      "Performance KPI cards",
      "Interactive charts and graphs",
      "Recent activity feeds",
      "Quick access buttons"
    ]
  },
  {
    id: "accounts",
    title: "Accounts Management",
    icon: Users,
    roles: ["admin", "manager", "agent"],
    description: "Comprehensive account management system for managing debtor accounts, payment histories, and contact information.",
    features: [
      "Account search and filtering",
      "Payment history tracking",
      "Contact information management",
      "Account status updates",
      "Bulk operations support"
    ],
    usage: [
      "Search for specific accounts by various criteria",
      "View detailed account information",
      "Update contact details and notes",
      "Track payment arrangements and history"
    ],
    keyFunctionalities: [
      "Advanced search filters",
      "Account detail views",
      "Payment tracking",
      "Contact management",
      "Notes and communication history"
    ]
  },
  {
    id: "calls",
    title: "Call Center",
    icon: Phone,
    roles: ["admin", "manager", "agent"],
    description: "Integrated call center interface with 3CX integration for managing recorded calls and audio playback.",
    features: [
      "3CX integration for call recordings",
      "Audio playback controls",
      "Call search and filtering",
      "Call quality indicators",
      "Recording management"
    ],
    usage: [
      "Listen to recorded calls for quality assurance",
      "Search calls by customer, agent, or date",
      "Review call dispositions and outcomes",
      "Download recordings for training purposes"
    ],
    keyFunctionalities: [
      "Audio player with controls",
      "Recording search functionality",
      "Call metadata display",
      "Quality assessment tools",
      "Integration with 3CX phone system"
    ]
  },
  {
    id: "dispositions",
    title: "Call Dispositions",
    icon: FileText,
    roles: ["admin", "manager"],
    description: "Management system for call outcome codes and disposition categories used by agents.",
    features: [
      "Pre-defined PRD-compliant dispositions",
      "Custom disposition creation",
      "Category-based organization",
      "Usage statistics tracking",
      "Active/inactive status management"
    ],
    usage: [
      "Create and edit disposition codes",
      "Organize dispositions by categories",
      "Monitor disposition usage statistics",
      "Enable/disable specific dispositions"
    ],
    keyFunctionalities: [
      "Disposition CRUD operations",
      "Category management",
      "Usage analytics",
      "Status toggling",
      "Search and filtering"
    ]
  },
  {
    id: "upload",
    title: "Data Upload",
    icon: Upload,
    roles: ["admin", "manager"],
    description: "Bulk data import system for uploading account data, payment information, and other bulk operations.",
    features: [
      "CSV/Excel file upload support",
      "Data validation and error checking",
      "Import progress tracking",
      "Template downloads",
      "Batch processing capabilities"
    ],
    usage: [
      "Upload new account data in bulk",
      "Import payment information",
      "Update existing account details",
      "Process large datasets efficiently"
    ],
    keyFunctionalities: [
      "File upload interface",
      "Data mapping tools",
      "Validation reports",
      "Error handling",
      "Progress monitoring"
    ]
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: BarChart3,
    roles: ["admin", "manager"],
    description: "Comprehensive reporting system with analytics and data visualization for performance tracking.",
    features: [
      "Pre-built report templates",
      "Custom report builder",
      "Data export capabilities",
      "Scheduled reports",
      "Interactive dashboards"
    ],
    usage: [
      "Generate performance reports",
      "Analyze collection trends",
      "Export data for external analysis",
      "Schedule automated reports"
    ],
    keyFunctionalities: [
      "Report generation tools",
      "Data visualization",
      "Export options",
      "Scheduling system",
      "Custom filters"
    ]
  },
  {
    id: "users",
    title: "User Management",
    icon: Shield,
    roles: ["admin"],
    description: "Administrative interface for managing user accounts, roles, and permissions within the system.",
    features: [
      "User account creation and management",
      "Role-based access control",
      "Permission management",
      "User activity monitoring",
      "Security settings"
    ],
    usage: [
      "Create new user accounts",
      "Assign roles and permissions",
      "Monitor user activity",
      "Manage security settings"
    ],
    keyFunctionalities: [
      "User CRUD operations",
      "Role assignment",
      "Permission matrices",
      "Activity logs",
      "Security controls"
    ]
  },
  {
    id: "settings",
    title: "System Settings",
    icon: Settings,
    roles: ["admin"],
    description: "System-wide configuration and settings management for customizing the application behavior.",
    features: [
      "Application configuration",
      "Integration settings",
      "Notification preferences",
      "System maintenance tools",
      "Backup and restore options"
    ],
    usage: [
      "Configure system parameters",
      "Set up integrations",
      "Manage notifications",
      "Perform system maintenance"
    ],
    keyFunctionalities: [
      "Configuration panels",
      "Integration management",
      "Notification settings",
      "Maintenance tools",
      "System monitoring"
    ]
  },
  {
    id: "3cx",
    title: "3CX Integration",
    icon: Headphones,
    roles: ["admin", "manager"],
    description: "Configuration and status monitoring for 3CX phone system integration.",
    features: [
      "Connection status monitoring",
      "Integration configuration",
      "Call statistics",
      "Phone system settings",
      "Troubleshooting tools"
    ],
    usage: [
      "Monitor 3CX connection status",
      "Configure phone system settings",
      "View call statistics",
      "Troubleshoot integration issues"
    ],
    keyFunctionalities: [
      "Status monitoring",
      "Configuration interface",
      "Statistics dashboard",
      "Diagnostic tools",
      "Settings management"
    ]
  },
  {
    id: "database",
    title: "Database Integration",
    icon: Database,
    roles: ["admin"],
    description: "Database connection management and configuration for external data sources.",
    features: [
      "Database connection setup",
      "Connection testing",
      "Query execution",
      "Data synchronization",
      "Performance monitoring"
    ],
    usage: [
      "Configure database connections",
      "Test connectivity",
      "Monitor database performance",
      "Manage data synchronization"
    ],
    keyFunctionalities: [
      "Connection management",
      "Testing utilities",
      "Performance metrics",
      "Sync controls",
      "Query tools"
    ]
  }
]

const roleColors = {
  admin: "bg-destructive/10 text-destructive border-destructive/20",
  manager: "bg-warning/10 text-warning border-warning/20",
  agent: "bg-success/10 text-success border-success/20"
}

export default function Documentation() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = [
    { value: "all", label: "All Pages" },
    { value: "core", label: "Core Features" },
    { value: "management", label: "Management" },
    { value: "integrations", label: "Integrations" }
  ]

  const getCategoryForPage = (pageId: string) => {
    if (["dashboard", "accounts", "calls"].includes(pageId)) return "core"
    if (["dispositions", "upload", "reports", "users", "settings"].includes(pageId)) return "management"
    if (["3cx", "database"].includes(pageId)) return "integrations"
    return "other"
  }

  const filteredPages = pagesDocumentation.filter(page => 
    selectedCategory === "all" || getCategoryForPage(page.id) === selectedCategory
  )

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-accent" />
              Documentation
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive guide to all features and functionalities
            </p>
          </div>
          <Badge variant="outline" className="border-accent text-accent">
            <Info className="w-3 h-3 mr-1" />
            Help Center
          </Badge>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-foreground">Filter by category:</span>
          <select 
            className="glass-light border-glass-border rounded-lg px-3 py-2 text-sm focus:ring-accent focus:border-accent"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="text-center">
            <Activity className="w-12 h-12 text-success mx-auto mb-2" />
            <CardTitle className="text-success">Core Features</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Essential tools for daily debt collection operations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="text-center">
            <Settings className="w-12 h-12 text-warning mx-auto mb-2" />
            <CardTitle className="text-warning">Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Administrative tools for system configuration
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="text-center">
            <Database className="w-12 h-12 text-accent mx-auto mb-2" />
            <CardTitle className="text-accent">Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              External system connections and configurations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pages Documentation */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Page Documentation</h2>
        
        <Accordion type="single" collapsible className="space-y-4">
          {filteredPages.map((page, index) => (
            <AccordionItem 
              key={page.id} 
              value={page.id}
              className="glass-card border-glass-border rounded-lg"
            >
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center space-x-4 w-full">
                  <page.icon className="w-6 h-6 text-accent flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-foreground">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">{page.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {page.roles.map(role => (
                      <Badge key={role} className={roleColors[role as keyof typeof roleColors]}>
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                  {/* Features */}
                  <div className="glass-light p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-accent" />
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {page.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-success flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Usage */}
                  <div className="glass-light p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2 text-accent" />
                      How to Use
                    </h4>
                    <ul className="space-y-2">
                      {page.usage.map((usage, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-success flex-shrink-0" />
                          {usage}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Functionalities */}
                  <div className="glass-light p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-accent" />
                      Main Functions
                    </h4>
                    <ul className="space-y-2">
                      {page.keyFunctionalities.map((func, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <CheckCircle className="w-3 h-3 mr-2 mt-0.5 text-success flex-shrink-0" />
                          {func}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Role Access Info */}
                <div className="mt-6 p-4 glass-light rounded-lg border border-accent/20">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-accent" />
                    Access Permissions
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This page is accessible to users with the following roles: {" "}
                    {page.roles.map((role, idx) => (
                      <span key={role}>
                        <Badge className={roleColors[role as keyof typeof roleColors]}>
                          {role}
                        </Badge>
                        {idx < page.roles.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Help Section */}
      <Card className="glass-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center text-accent">
            <Info className="w-5 h-5 mr-2" />
            Need Additional Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            If you need further assistance or have questions about specific features, please contact your system administrator or refer to the user manual.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-accent text-accent">
              User Manual Available
            </Badge>
            <Badge variant="outline" className="border-success text-success">
              Training Materials
            </Badge>
            <Badge variant="outline" className="border-warning text-warning">
              Video Tutorials
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}