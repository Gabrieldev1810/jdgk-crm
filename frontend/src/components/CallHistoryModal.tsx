import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Call, CallSearchParams, CallStatistics } from '@/types/api';
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

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'hsl(var(--background) / 0.8)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div 
        className="glass-dialog border-glass-border max-w-4xl w-full max-h-[90vh] overflow-hidden relative transform rounded-xl"
        style={{ 
          zIndex: 10000,
          maxWidth: '1024px',
          maxHeight: '90vh',
          background: 'hsl(var(--glass))',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--glass-border))',
          boxShadow: 'var(--shadow-glass)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-glass-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                📞 Call History - {accountName}
              </h2>
              <p className="text-sm mt-1 text-muted-foreground">
                Account ID: {accountId}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-2xl font-bold rounded-lg p-2 transition-all duration-200 hover:bg-accent/10 text-muted-foreground hover:text-accent"
            >
              ×
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="px-6 py-5 border-b border-glass-border bg-muted/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-xl text-center bg-gradient-glass border border-accent/20 shadow-soft">
                <div className="text-2xl font-bold text-accent">
                  {statistics.totalCalls}
                </div>
                <div className="text-sm font-medium text-foreground">
                  Total Calls
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl text-center bg-gradient-glass border border-success/20 shadow-soft">
                <div className="text-2xl font-bold text-success">
                  {statistics.completedCalls}
                </div>
                <div className="text-sm font-medium text-foreground">
                  Completed
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl text-center bg-gradient-glass border border-warning/20 shadow-soft">
                <div className="text-2xl font-bold text-warning">
                  {formatDuration(statistics.avgDuration || 0)}
                </div>
                <div className="text-sm font-medium text-foreground">
                  Avg Duration
                </div>
              </div>
              <div className="glass-card p-4 rounded-xl text-center bg-gradient-glass border border-secondary/30 shadow-soft">
                <div className="text-2xl font-bold text-secondary">
                  {(statistics.successRate || 0).toFixed(1)}%
                </div>
                <div className="text-sm font-medium text-foreground">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="px-6 py-4 border-b border-glass-border bg-muted/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search calls..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring font-medium placeholder:font-normal placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusFilter('COMPLETED')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedStatus === 'COMPLETED'
                    ? 'bg-gradient-accent hover:shadow-accent text-accent-foreground'
                    : 'glass-card border border-border hover:border-accent/30 bg-card text-card-foreground'
                }`}
              >
                ✅ Completed
              </button>
              <button
                onClick={() => handleStatusFilter('IN_PROGRESS')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedStatus === 'IN_PROGRESS'
                    ? 'bg-gradient-accent hover:shadow-accent text-accent-foreground'
                    : 'glass-card border border-border hover:border-accent/30 bg-card text-card-foreground'
                }`}
              >
                🔄 In Progress
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
            <div className="text-center py-12">
              <div className="text-6xl mb-6 text-accent">📞</div>
              <p className="text-lg font-medium mb-2 text-foreground">
                No calls found for this account
              </p>
              <p className="text-sm text-muted-foreground">
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
                    
                    {call.accountPhone && (
                      <div>Phone: {call.accountPhone.phoneNumber}</div>
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
          <div className="px-6 py-4 border-t border-glass-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium border border-border bg-card text-card-foreground rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent/30"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium border border-border bg-card text-card-foreground rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-accent/30"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-5 border-t border-glass-border bg-muted/20">
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => onOpenChange(false)}
              className="px-6 py-3 text-sm font-medium border border-border bg-card text-card-foreground rounded-xl transition-all duration-200 hover:border-accent/30 hover:bg-card/80"
            >
              Close
            </button>
            <button 
              className="px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gradient-accent hover:shadow-accent text-accent-foreground hover:translate-y-[-1px]"
            >
              📞 Make Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal using portal to document.body to avoid z-index stacking issues
  return createPortal(modalContent, document.body);
}