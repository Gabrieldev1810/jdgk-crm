import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react"

interface Task {
  id: string
  status: "completed" | "in-progress" | "pending" | "failed"
  task: string
  cyclePhase: "planning" | "development" | "testing" | "deployment" | "maintenance"
}

const tasks: Task[] = [
  {
    id: "1",
    status: "completed",
    task: "Implement user authentication system",
    cyclePhase: "development"
  },
  {
    id: "2", 
    status: "in-progress",
    task: "Design responsive dashboard layout",
    cyclePhase: "development"
  },
  {
    id: "3",
    status: "pending",
    task: "Set up database migrations",
    cyclePhase: "planning"
  },
  {
    id: "4",
    status: "completed",
    task: "Create API endpoints for user management",
    cyclePhase: "development"
  },
  {
    id: "5",
    status: "in-progress", 
    task: "Write unit tests for core functionality",
    cyclePhase: "testing"
  },
  {
    id: "6",
    status: "failed",
    task: "Deploy to staging environment",
    cyclePhase: "deployment"
  },
  {
    id: "7",
    status: "pending",
    task: "Implement error handling middleware",
    cyclePhase: "development"
  },
  {
    id: "8",
    status: "completed",
    task: "Configure CI/CD pipeline",
    cyclePhase: "deployment"
  }
]

function getStatusBadge(status: Task['status']) {
  const statusConfig = {
    completed: {
      variant: "default" as const,
      icon: CheckCircle2,
      className: "bg-success text-white border-success"
    },
    "in-progress": {
      variant: "secondary" as const, 
      icon: Clock,
      className: "bg-warning text-foreground border-warning"
    },
    pending: {
      variant: "outline" as const,
      icon: AlertCircle,
      className: "border-muted-foreground text-muted-foreground"
    },
    failed: {
      variant: "destructive" as const,
      icon: XCircle,
      className: "bg-destructive text-destructive-foreground border-destructive"
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </Badge>
  )
}

function getCyclePhaseBadge(phase: Task['cyclePhase']) {
  const phaseColors = {
    planning: "bg-accent/10 text-accent border-accent/20",
    development: "bg-primary/10 text-primary border-primary/20", 
    testing: "bg-warning/10 text-warning border-warning/20",
    deployment: "bg-success/10 text-success border-success/20",
    maintenance: "bg-muted text-muted-foreground border-muted"
  }

  return (
    <Badge variant="outline" className={phaseColors[phase]}>
      {phase.charAt(0).toUpperCase() + phase.slice(1)}
    </Badge>
  )
}

export default function TaskList() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            Frontend Task List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Task</TableHead>
                <TableHead className="font-semibold text-foreground">Cycle Phase</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-accent/5">
                  <TableCell>
                    {getStatusBadge(task.status)}
                  </TableCell>
                  <TableCell className="font-medium max-w-md">
                    {task.task}
                  </TableCell>
                  <TableCell>
                    {getCyclePhaseBadge(task.cyclePhase)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}