import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { vicidialService, VicidialCampaign } from "@/services/vicidial"
import { accountService } from "@/services/accounts"
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

// Removed mock data - should use API for upload history

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
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [campaigns, setCampaigns] = useState<VicidialCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await vicidialService.getCampaigns()
        setCampaigns(data)
      } catch (error) {
        console.error("Failed to fetch campaigns", error)
      }
    }
    fetchCampaigns()
  }, [])

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
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files))
    }
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

    try {
      // Simulate progress for UX
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return 90
          return prev + 10
        })
      }, 500)

      const file = selectedFiles[0]
      const response = await accountService.bulkUpload({
        file,
        campaignId: selectedCampaignId || undefined
      })

      clearInterval(interval)
      setUploadProgress(100)

      // Handle both wrapper response and direct result
      const result = response.data || response as any
      
      if (response.success && result) {
        // Add to history
        const newUpload: UploadHistory = {
          id: result.batchId || `UP-${Date.now()}`,
          filename: file.name,
          uploadDate: new Date().toLocaleString(),
          status: result.failedRecords > 0 ? "error" : "success",
          totalRows: result.totalRecords,
          successRows: result.successfulRecords,
          errorRows: result.failedRecords,
          uploader: "Current User" // Ideally get from auth context
        }
        setUploadHistory(prev => [newUpload, ...prev])
        
        if (result.failedRecords > 0) {
          // Show detailed errors
          const errorMessages = result.errors.map((e: any) => `Row ${e.row}: ${e.message}`).join('\n');
          alert(`Upload completed with ${result.successfulRecords} successful records and ${result.failedRecords} errors.\n\nErrors:\n${errorMessages.substring(0, 500)}${errorMessages.length > 500 ? '...' : ''}`)
        } else {
          alert(`Upload successful! ${result.successfulRecords} records imported.`)
        }
      } else {
        console.error('Upload response error:', response);
        alert(`Upload failed: ${response.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Upload failed:', error)
      alert(`Upload failed: ${error.message || 'Please check the console for details.'}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setSelectedFiles([])
    }
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
      'Account Number',
      'Name',
      'Email',
      'Address',
      'Original Amount',
      'Out Standing Balance (OSB)',
      'Bank Partner',
      'Status',
      'Phone Numbers',
      'Assigned Agent',
      'Last Contact',
      'Remarks'
    ]
    
    // Create template data with placeholders - no hardcoded real data
    const sampleData = [
      [
        'ACC001',
        'John Doe',
        'john.doe@email.com',
        '123 Main St, New York, NY',
        '1000.00',
        '850.00',
        'Chase',
        'NEW',
        '555-0101',
        'Agent Smith',
        '2023-01-01',
        'Customer promised to pay'
      ],
      [
        'ACC002',
        'Jane Smith',
        'jane.smith@email.com',
        '456 Oak Ave, Los Angeles, CA',
        '2500.00',
        '2200.00',
        'Amex',
        'NEW',
        '555-0102',
        '',
        '2023-01-02',
        'Call back later'
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
                    <div className="flex-1 mr-4">
                      <Label htmlFor="campaign-select" className="mb-2 block text-xs text-muted-foreground">Target Campaign (Optional)</Label>
                      <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                        <SelectTrigger id="campaign-select" className="w-full glass-light border-glass-border">
                          <SelectValue placeholder="Select Campaign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Campaign</SelectItem>
                          {campaigns.map(c => (
                            <SelectItem key={c.campaign_id} value={c.campaign_id}>{c.campaign_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-xs text-muted-foreground">
                        Required columns: Account ID, Name, Phone Numbers, Balance
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
                    <div className="text-muted-foreground">Account Number, Name, Email, Address, Phone Numbers</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">Financial Data</div>
                    <div className="text-muted-foreground">Original Amount, Out Standing Balance (OSB), Bank Partner, Status</div>
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