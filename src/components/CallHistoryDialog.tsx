import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Clock, 
  Calendar, 
  User, 
  DollarSign, 
  MessageSquare,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Call, CallSearchParams, CallStatistics } from '@/types/api';
import { callsService } from '@/services/calls';
import { format } from 'date-fns';

interface CallHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountName: string;
}

export function CallHistoryDialog({ 
  open, 
  onOpenChange, 
  accountId, 
  accountName 
}: CallHistoryDialogProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [statistics, setStatistics] = useState<CallStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedDisposition, setSelectedDisposition] = useState<string>('');

  const pageSize = 10;

  // ================================
  // DATA FETCHING
  // ================================
  const fetchCalls = async () => {
    if (!accountId) return;
    
    setLoading(true);
    try {
      const params: CallSearchParams = {
        page: currentPage,
        limit: pageSize,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus && { status: selectedStatus as any }),
        ...(selectedDisposition && { disposition: selectedDisposition as any }),
      };

      const response = await callsService.getCallsByAccount(accountId, params);
      setCalls(response.data);
      setTotalPages(response.pagination.totalPages);

      // Fetch statistics
      const stats = await callsService.getCallStatistics(accountId);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && accountId) {
      fetchCalls();
    }
  }, [open, accountId, currentPage, searchTerm, selectedStatus, selectedDisposition]);

  // ================================
  // EVENT HANDLERS
  // ================================
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status === selectedStatus ? '' : status);
    setCurrentPage(1);
  };

  const handleDispositionFilter = (disposition: string) => {
    setSelectedDisposition(disposition === selectedDisposition ? '' : disposition);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ================================
  // RENDER COMPONENTS
  // ================================
  const renderCallItem = (call: Call) => (
    <div key={call.id} className="border rounded-lg p-4 space-y-3">
      {/* Call Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Phone 
            className={`h-4 w-4 ${
              call.direction === 'INBOUND' ? 'text-green-600' : 'text-blue-600'
            }`} 
          />
          <span className="font-medium">
            {call.direction === 'INBOUND' ? 'Incoming' : 'Outgoing'} Call
          </span>
          <Badge 
            variant="outline" 
            className={callsService.getStatusColor(call.status)}
          >
            {callsService.getStatusDisplay(call.status)}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(call.createdAt), 'MMM dd, yyyy HH:mm')}
        </div>
      </div>

      {/* Call Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>Duration: {callsService.formatDuration(call.duration)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>Agent: {call.agent?.firstName} {call.agent?.lastName}</span>
        </div>

        {call.phoneNumber && (
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>Phone: {call.phoneNumber}</span>
          </div>
        )}

        {call.disposition && (
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <Badge 
              variant="outline" 
              className={callsService.getDispositionColor(call.disposition)}
            >
              {callsService.getDispositionDisplay(call.disposition)}
            </Badge>
          </div>
        )}

        {(call.amountPromised || call.amountCollected) && (
          <>
            {call.amountPromised && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-400" />
                <span>Promised: ${call.amountPromised.toFixed(2)}</span>
              </div>
            )}
            {call.amountCollected && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span>Collected: ${call.amountCollected.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Call Notes */}
      {call.notes && (
        <div className="border-t pt-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Notes:</span> {call.notes}
          </p>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{statistics.totalCalls}</div>
          <div className="text-sm text-blue-600">Total Calls</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{statistics.completedCalls}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            ${statistics.totalAmountCollected?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-purple-600">Collected</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {callsService.formatDuration(statistics.totalDuration || 0)}
          </div>
          <div className="text-sm text-orange-600">Total Duration</div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Call History - {accountName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistics */}
          {renderStatistics()}

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === 'COMPLETED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('COMPLETED')}
              >
                Completed
              </Button>
              <Button
                variant={selectedStatus === 'IN_PROGRESS' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('IN_PROGRESS')}
              >
                In Progress
              </Button>
              <Button
                variant={selectedDisposition === 'CONTACT_MADE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDispositionFilter('CONTACT_MADE')}
              >
                Contact Made
              </Button>
            </div>
          </div>

          <Separator />

          {/* Call List */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading calls...</div>
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No calls found for this account</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start making calls to see the history here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {calls.map(renderCallItem)}
              </div>
            )}
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}