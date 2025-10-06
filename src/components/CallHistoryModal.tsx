import React, { useState, useEffect } from 'react';
import { Call, CallSearchParams, CallStatistics } from '../types/api';
import { callsService } from '../services/calls';

interface CallHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountName: string;
}

export function CallHistoryModal({ 
  open, 
  onOpenChange, 
  accountId, 
  accountName 
}: CallHistoryModalProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [statistics, setStatistics] = useState<CallStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

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
  }, [open, accountId, currentPage, searchTerm, selectedStatus]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      RINGING: 'text-blue-600',
      IN_PROGRESS: 'text-orange-600',
      COMPLETED: 'text-green-600',
      FAILED: 'text-red-600',
      BUSY: 'text-yellow-600',
      NO_ANSWER: 'text-gray-600',
      CANCELLED: 'text-gray-500'
    };
    return colorMap[status] || 'text-gray-600';
  };

  const getDispositionColor = (disposition?: string) => {
    if (!disposition) return 'text-gray-600';
    
    const colorMap: Record<string, string> = {
      CONTACT_MADE: 'text-green-600',
      PROMISE_TO_PAY: 'text-blue-600',
      PAYMENT_MADE: 'text-emerald-600',
      CALLBACK_REQUESTED: 'text-purple-600',
      LEFT_MESSAGE: 'text-blue-500',
      NO_ANSWER: 'text-gray-600',
      BUSY: 'text-yellow-600',
      WRONG_NUMBER: 'text-orange-600',
      DISCONNECTED: 'text-red-600',
      DO_NOT_CALL: 'text-red-700',
      DISPUTE: 'text-red-800'
    };
    
    return colorMap[disposition] || 'text-gray-600';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Call History - {accountName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Account ID: {accountId}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  {formatDuration(statistics.totalDuration || 0)}
                </div>
                <div className="text-sm text-orange-600">Total Duration</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusFilter('COMPLETED')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedStatus === 'COMPLETED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => handleStatusFilter('IN_PROGRESS')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  selectedStatus === 'IN_PROGRESS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                In Progress
              </button>
            </div>
          </div>
        </div>

        {/* Call List */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading calls...</div>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📞</div>
              <p className="text-gray-500">No calls found for this account</p>
              <p className="text-sm text-gray-400 mt-1">
                Start making calls to see the history here
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {calls.map((call) => (
                <div key={call.id} className="border rounded-lg p-4 space-y-3">
                  {/* Call Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {call.direction === 'INBOUND' ? '📞 Incoming' : '📱 Outgoing'} Call
                      </span>
                      <span className={`text-sm font-medium ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(call.createdAt)}
                    </div>
                  </div>

                  {/* Call Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Duration: {formatDuration(call.duration)}</div>
                    <div>Agent: {call.agent?.firstName} {call.agent?.lastName}</div>
                    
                    {call.phoneNumber && (
                      <div>Phone: {call.phoneNumber}</div>
                    )}

                    {call.disposition && (
                      <div className={getDispositionColor(call.disposition)}>
                        Disposition: {call.disposition.replace(/_/g, ' ')}
                      </div>
                    )}

                    {call.amountPromised && (
                      <div className="text-blue-600">
                        Promised: ${call.amountPromised.toFixed(2)}
                      </div>
                    )}

                    {call.amountCollected && (
                      <div className="text-green-600">
                        Collected: ${call.amountCollected.toFixed(2)}
                      </div>
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
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              📞 Make Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}