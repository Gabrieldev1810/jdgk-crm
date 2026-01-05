import React, { useEffect, useState } from 'react';
import { callsService } from '@/services';
import { Call } from '@/types/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Loader2, Search, Play, FileAudio } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CallHistory() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const response = await callsService.getCalls({
        page,
        limit: 10,
        // search, // Assuming backend supports search
        // status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setCalls(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load call history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [page, search, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCalls();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Call History</h2>
          <p className="text-muted-foreground">
            View and manage call logs and recordings.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Logs</CardTitle>
          <CardDescription>
            A list of all calls made or received by the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 max-w-sm">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search calls..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                <SelectItem value="BUSY">Busy</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No calls found.
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        {format(new Date(call.startTime), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {call.agent ? (
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {call.agent.firstName} {call.agent.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {call.agent.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {call.account ? (
                          <span className="font-medium">
                            {call.account.fullName}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{call.direction}</Badge>
                      </TableCell>
                      <TableCell>{formatDuration(call.duration || 0)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            call.status === 'COMPLETED'
                              ? 'default' // Changed from 'success' to 'default' as 'success' might not exist in standard shadcn badge
                              : call.status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {call.recordingPath ? (
                          <Button variant="ghost" size="icon" title="Play Recording">
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : (
                          <FileAudio className="h-4 w-4 text-muted-foreground ml-auto opacity-20" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
