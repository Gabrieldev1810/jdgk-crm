import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Phone, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  FileAudio
} from "lucide-react"

interface RecordedCall {
  id: string
  accountId: string
  customerName: string
  phoneNumber: string
  agentName: string
  startTime: string
  duration: number
  disposition: string
  fileUrl: string
  fileSize: string
  quality: "excellent" | "good" | "fair" | "poor"
}

// Mock recorded calls data
const mockRecordedCalls: RecordedCall[] = [
  {
    id: "REC-001",
    accountId: "ACC-001",
    customerName: "John Smith",
    phoneNumber: "(555) 123-4567",
    agentName: "Agent Sarah",
    startTime: "2024-01-15 14:30:25",
    duration: 425,
    disposition: "PAYMENT_ARRANGED",
    fileUrl: "/recordings/rec-001.wav",
    fileSize: "8.2 MB",
    quality: "excellent"
  },
  {
    id: "REC-002", 
    accountId: "ACC-002",
    customerName: "Emily Davis",
    phoneNumber: "(555) 456-7890",
    agentName: "Agent Mike",
    startTime: "2024-01-15 13:15:10",
    duration: 180,
    disposition: "NO_ANSWER",
    fileUrl: "/recordings/rec-002.wav", 
    fileSize: "3.5 MB",
    quality: "good"
  },
  {
    id: "REC-003",
    accountId: "ACC-003", 
    customerName: "Robert Wilson",
    phoneNumber: "(555) 789-0123",
    agentName: "Agent Lisa",
    startTime: "2024-01-15 12:45:33",
    duration: 650,
    disposition: "PAYMENT_FULL",
    fileUrl: "/recordings/rec-003.wav",
    fileSize: "12.6 MB", 
    quality: "excellent"
  },
  {
    id: "REC-004",
    accountId: "ACC-005",
    customerName: "Maria Garcia", 
    phoneNumber: "(555) 321-6547",
    agentName: "Agent Tom",
    startTime: "2024-01-15 11:20:15",
    duration: 95,
    disposition: "CALLBACK_REQUESTED",
    fileUrl: "/recordings/rec-004.wav",
    fileSize: "1.8 MB",
    quality: "fair"
  }
]

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getQualityColor(quality: RecordedCall["quality"]) {
  switch (quality) {
    case "excellent": return "bg-success/10 text-success border-success/20"
    case "good": return "bg-accent/10 text-accent border-accent/20"
    case "fair": return "bg-warning/10 text-warning border-warning/20"
    case "poor": return "bg-destructive/10 text-destructive border-destructive/20"
    default: return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

function getDispositionColor(disposition: string) {
  switch (disposition) {
    case "PAYMENT_FULL":
    case "PAYMENT_ARRANGED":
      return "bg-success/10 text-success border-success/20"
    case "CALLBACK_REQUESTED":
    case "VOICEMAIL_LEFT":
      return "bg-accent/10 text-accent border-accent/20"
    case "NO_ANSWER":
    case "DISCONNECTED":
      return "bg-warning/10 text-warning border-warning/20"
    case "REFUSED_PAYMENT":
    case "DISPUTE_CLAIM":
      return "bg-destructive/10 text-destructive border-destructive/20"
    default:
      return "bg-muted/10 text-muted-foreground border-muted/20"
  }
}

export default function CallCenter() {
  const [recordedCalls] = useState(mockRecordedCalls)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCall, setSelectedCall] = useState<RecordedCall | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  // Filter calls based on search term
  const filteredCalls = recordedCalls.filter(call =>
    call.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.phoneNumber.includes(searchTerm) ||
    call.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.accountId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const playCall = (call: RecordedCall) => {
    setSelectedCall(call)
    setIsPlaying(true)
    setCurrentTime(0)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const stopCall = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setSelectedCall(null)
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 border-glass-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-poppins text-foreground">
              Recorded Calls
            </h1>
            <p className="text-muted-foreground mt-1">
              3CX Call Recordings • Audio Playback & Analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-success text-success">
              <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
              3CX Connected
            </Badge>
            <Badge variant="secondary" className="font-mono">
              {recordedCalls.length} Recordings
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Audio Player & Call Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio Player */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileAudio className="w-5 h-5 text-accent" />
                <span>Audio Player</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedCall ? (
                <div className="text-center py-12">
                  <FileAudio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Recording Selected</h3>
                  <p className="text-muted-foreground mb-6">
                    Select a recorded call from the list to start playback
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Call Info */}
                  <div className="glass-light p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {selectedCall.customerName}
                        </h3>
                        <p className="text-muted-foreground font-mono">
                          {selectedCall.phoneNumber} • {selectedCall.agentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {selectedCall.startTime}
                        </div>
                        <Badge className={getQualityColor(selectedCall.quality)}>
                          {selectedCall.quality.toUpperCase()} Quality
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Account:</span>
                        <div className="font-mono font-medium">{selectedCall.accountId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <div className="font-medium">{formatDuration(selectedCall.duration)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">File Size:</span>
                        <div className="font-medium">{selectedCall.fileSize}</div>
                      </div>
                    </div>
                  </div>

                  {/* Playback Progress */}
                  <div className="text-center">
                    <div className="text-4xl font-mono font-bold text-foreground mb-2">
                      {formatDuration(currentTime)} / {formatDuration(selectedCall.duration)}
                    </div>
                    <div className="w-full bg-glass-light rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-accent h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${(currentTime / selectedCall.duration) * 100}%` }}
                      />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={isPlaying ? "border-success text-success" : "border-muted text-muted-foreground"}
                    >
                      {isPlaying ? "Playing" : "Paused"}
                    </Badge>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setIsMuted(!isMuted)}
                      className="glass-light border-glass-border"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={togglePlayPause}
                      className="bg-gradient-accent hover:shadow-accent"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={stopCall}
                      className="glass-light border-glass-border"
                    >
                      Stop
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="glass-light border-glass-border"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Details */}
          {selectedCall && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-accent" />
                  <span>Call Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Disposition</label>
                    <Badge className={getDispositionColor(selectedCall.disposition)}>
                      {selectedCall.disposition.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">File Path</label>
                    <p className="text-sm font-mono text-foreground">{selectedCall.fileUrl}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recordings List */}
        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-accent" />
                <span>Call Recordings</span>
              </CardTitle>
              <CardDescription>
                {filteredCalls.length} recordings available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search recordings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-light border-glass-border focus:ring-accent focus:border-accent"
                />
              </div>

              {/* Recordings List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCalls.map((call) => (
                  <div 
                    key={call.id}
                    className={`glass-light p-3 rounded-lg hover:bg-glass-medium/50 transition-colors cursor-pointer ${
                      selectedCall?.id === call.id ? 'ring-2 ring-accent' : ''
                    }`}
                    onClick={() => playCall(call)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-foreground">
                        {call.customerName}
                      </div>
                      <Badge className={getQualityColor(call.quality)}>
                        {call.quality}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="font-mono">{call.phoneNumber}</div>
                      <div className="flex justify-between">
                        <span>{call.agentName}</span>
                        <span>{formatDuration(call.duration)}</span>
                      </div>
                      <div className="text-xs">{call.startTime}</div>
                    </div>
                  </div>
                ))}

                {filteredCalls.length === 0 && (
                  <div className="text-center py-8">
                    <FileAudio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recordings found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Recording Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Recordings</span>
                <span className="font-mono font-bold">{recordedCalls.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Duration</span>
                <span className="font-mono font-bold">
                  {formatDuration(recordedCalls.reduce((acc, call) => acc + call.duration, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <span className="font-mono font-bold">
                  {formatDuration(Math.round(recordedCalls.reduce((acc, call) => acc + call.duration, 0) / recordedCalls.length))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="font-mono font-bold text-accent">47.2 GB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}