import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  Download,
  Eye,
  FileText,
  Database,
  Users
} from "lucide-react"

interface UploadHistory {
  id: string
  filename: string
  uploadDate: string
  status: "success" | "error" | "processing"
  totalRows: number
  successRows: number
  errorRows: number
  uploader: string
}

// Mock data
const mockUploads: UploadHistory[] = [
  {
    id: "UP-001",
    filename: "accounts_batch_january.csv",
    uploadDate: "2024-01-15 14:30",
    status: "success",
    totalRows: 1245,
    successRows: 1245,
    errorRows: 0,
    uploader: "admin@bank.com"
  },
  {
    id: "UP-002", 
    filename: "new_accounts_batch_2.xlsx",
    uploadDate: "2024-01-14 09:15",
    status: "error",
    totalRows: 892,
    successRows: 756,
    errorRows: 136,
    uploader: "manager@bank.com"
  },
  {
    id: "UP-003",
    filename: "customer_updates.csv", 
    uploadDate: "2024-01-13 16:45",
    status: "success",
    totalRows: 456,
    successRows: 456,
    errorRows: 0,
    uploader: "admin@bank.com"
  }
]

function getStatusColor(status: UploadHistory["status"]) {
  switch (status) {
    case "success": return "bg-success/10 text-success border-success/20"
    case "error": return "bg-destructive/10 text-destructive border-destructive/20"
    case "processing": return "bg-warning/10 text-warning border-warning/20"
    default: return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getStatusIcon(status: UploadHistory["status"]) {
  switch (status) {
    case "success": return <CheckCircle className="w-4 h-4" />
    case "error": return <AlertTriangle className="w-4 h-4" />
    case "processing": return <Upload className="w-4 h-4" />
    default: return <FileText className="w-4 h-4" />
  }
}

export default function UploadData() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadHistory, setUploadHistory] = useState(mockUploads)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    setSelectedFiles(files)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    console.log('Files selected:', files);
    setSelectedFiles(files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
  }

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval)
          return 95
        }
        return prev + Math.random() * 10
      })
    }, 200)

    // Simulate processing
    setTimeout(() => {
      clearInterval(interval)
      setUploadProgress(100)
      
      // Add to history
      const newUpload: UploadHistory = {
        id: `UP-${Date.now()}`,
        filename: selectedFiles[0].name,
        uploadDate: new Date().toLocaleString(),
        status: "success",
        totalRows: Math.floor(Math.random() * 1000) + 100,
        successRows: Math.floor(Math.random() * 950) + 50,
        errorRows: Math.floor(Math.random() * 50),
        uploader: "current@user.com"
      }
      newUpload.successRows = newUpload.totalRows - newUpload.errorRows

      setUploadHistory(prev => [newUpload, ...prev])
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
        setSelectedFiles([])
      }, 1000)
    }, 3000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadTemplate = () => {
    console.log('Template download started');
    // Create CSV content with the exact format from the JDGK CRM template
    const headers = [
      'Account NUMBER',
      'Banks',
      'REGION_Branch Name',
      'ACCNT Name',
      'Address',
      'Released Date',
      'Loan Availed',
      'Product',
      'Last Payment date',
      'Principal Balance',
      'OUTSTANDING BALANCE',
      'Contact Info',
      'TELE',
      'STATUS',
      'PAYMENT AMOUNT',
      'REMARKS'
    ]
    
    // Create sample data rows to show the expected format
    const sampleData = [
      [
        'ACC001',
        'JDGK Bank',
        'Metro Manila - Main Branch',
        'Juan Dela Cruz',
        '123 Sample St, Quezon City, Philippines',
        '01/15/2024',
        '500,000.00',
        'Home Loan',
        '10/01/2024',
        '450,000.00',
        '425,000.00',
        'juan.delacruz@email.com',
        '09171234567',
        'ACTIVE',
        '15,000.00',
        'Regular payment schedule'
      ],
      [
        'ACC002',
        'JDGK Bank',
        'Cebu - Branch 1',
        'Maria Santos',
        '456 Example Ave, Cebu City, Philippines',
        '02/20/2024',
        '300,000.00',
        'Personal Loan',
        '09/28/2024',
        '250,000.00',
        '235,000.00',
        'maria.santos@email.com',
        '09189876543',
        'ACTIVE',
        '12,000.00',
        'On-time payment history'
      ],
      [
        'ACC003',
        'JDGK Bank',
        'Davao - Branch 2',
        'Roberto Garcia',
        '789 Test Blvd, Davao City, Philippines',
        '03/10/2024',
        '750,000.00',
        'Business Loan',
        '09/30/2024',
        '700,000.00',
        '685,000.00',
        'roberto.garcia@email.com',
        '09123456789',
        'ACTIVE',
        '18,500.00',
        'Business expansion loan'
      ]
    ]
    
    // Convert to CSV format with proper escaping
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Add UTF-8 BOM for proper Excel handling
    const bom = '\uFEFF'
    const finalContent = bom + csvContent
    
    // Create and download the file
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'JDGK_CRM_Upload_Template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    console.log('Template download completed');
  }

  const stats = {
    totalUploads: uploadHistory.length,
    successfulUploads: uploadHistory.filter(u => u.status === "success").length,
    totalRecords: uploadHistory.reduce((sum, u) => sum + u.successRows, 0),
    errorRate: uploadHistory.length > 0 
      ? (uploadHistory.reduce((sum, u) => sum + u.errorRows, 0) / uploadHistory.reduce((sum, u) => sum + u.totalRows, 0) * 100).toFixed(1)
      : 0
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              Data Upload
            </h1>
            <p className="text-muted-foreground mt-1">
              Import CRM accounts using the JDGK template format (CSV/Excel)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="glass-light border-glass-border"
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" className="glass-light border-glass-border">
              <FileText className="w-4 h-4 mr-2" />
              Guide
            </Button>
            <Button 
              className="bg-gradient-accent hover:shadow-accent cursor-pointer"
              onClick={() => {
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) {
                  fileInput.click();
                }
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Uploads
            </CardTitle>
            <Upload className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {stats.totalUploads}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">
              {Math.round((stats.successfulUploads / stats.totalUploads) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">Upload success</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Records Imported
            </CardTitle>
            <Database className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-foreground">
              {stats.totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Customer accounts</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover:shadow-accent transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Rate
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-warning">
              {stats.errorRate}%
            </div>
            <p className="text-xs text-muted-foreground">Data errors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                <span>File Upload</span>
              </CardTitle>
              <CardDescription>
                Upload your JDGK CRM data using the template format. Drag and drop or click to browse files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUploading ? (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Upload className="w-12 h-12 text-accent mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Processing Upload...
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Validating data and importing records
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono">{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                </div>
              ) : selectedFiles.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Selected Files ({selectedFiles.length})
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFiles}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 glass-light rounded-lg border border-glass-border"
                      >
                        <div className="flex items-center space-x-3">
                          <FileSpreadsheet className="w-5 h-5 text-accent flex-shrink-0" />
                          <div>
                            <div className="font-medium text-foreground text-sm">{file.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                    <div className="text-xs text-muted-foreground">
                      Required columns: Account ID, Name, Phone Numbers, Balance, Due Date, Bank Partner
                    </div>
                    <Button 
                      onClick={handleFileUpload}
                      className="bg-gradient-accent hover:shadow-accent"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? "border-accent bg-accent/5" 
                      : "border-glass-border hover:border-accent/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FileSpreadsheet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload Account Data
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Supports CSV and Excel files up to 50MB
                  </p>
                  
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    Use JDGK CRM template format - Download template above for exact column structure
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upload Requirements */}
        <div>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">File Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Supported Formats</div>
                    <div className="text-muted-foreground">CSV, XLSX, XLS</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Maximum Size</div>
                    <div className="text-muted-foreground">50MB per file</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">JDGK CRM Format</div>
                    <div className="text-muted-foreground">Account NUMBER, Banks, REGION_Branch Name, ACCNT Name, Address</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Financial Data</div>
                    <div className="text-muted-foreground">Principal Balance, Outstanding Balance, Payment Amount, Status</div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-glass-border">
                <Button 
                  variant="outline" 
                  className="w-full glass-light border-glass-border"
                  onClick={downloadTemplate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload History */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-accent" />
            <span>Upload History</span>
          </CardTitle>
          <CardDescription>
            Recent file uploads and processing results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">File</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Records</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Uploader</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((upload, index) => (
                  <tr 
                    key={upload.id}
                    className="border-b border-glass-border/50 hover:bg-glass-light/30 transition-colors"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-4 h-4 text-accent flex-shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{upload.filename}</div>
                          <div className="text-xs text-muted-foreground font-mono">{upload.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm text-foreground">{upload.uploadDate}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(upload.status)}>
                        {getStatusIcon(upload.status)}
                        <span className="ml-1">{upload.status.toUpperCase()}</span>
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-mono font-bold text-foreground">
                          {upload.totalRows.toLocaleString()} total
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {upload.successRows.toLocaleString()} success, {upload.errorRows.toLocaleString()} errors
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">{upload.uploader}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        {upload.errorRows > 0 && (
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}