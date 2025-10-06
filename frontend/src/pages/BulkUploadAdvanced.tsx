import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, History } from 'lucide-react';
import { api } from '@/services';

interface BulkUploadOptions {
  batchName?: string;
  skipErrors?: boolean;
  updateExisting?: boolean;
}

interface UploadError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

interface UploadResult {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: UploadError[];
  duplicates: number;
  message: string;
}

interface UploadBatch {
  id: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  status: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  createdAt: string;
  uploadedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  errors: UploadError[];
}

export default function BulkUploadAdvanced() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadOptions, setUploadOptions] = useState<BulkUploadOptions>({
    skipErrors: false,
    updateExisting: false,
  });
  const [showHistory, setShowHistory] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadBatch[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('batchName', uploadOptions.batchName || `Upload ${new Date().toLocaleDateString()}`);
      formData.append('skipErrors', uploadOptions.skipErrors.toString());
      formData.append('updateExisting', uploadOptions.updateExisting.toString());

      const response: any = await api.post('/bulk-upload/upload', formData);

      if (response.success) {
        setUploadResult(response.data);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      setUploadResult({
        batchId: '',
        status: 'failed',
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        errors: [{ row: 0, message: error.message || 'Upload failed' }],
        duplicates: 0,
        message: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const loadUploadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response: any = await api.get('/bulk-upload/history');
      if (response.success) {
        setUploadHistory(response.data.batches);
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `accountNumber,firstName,lastName,email,originalAmount,currentBalance,status,priority
ACC001,John,Doe,john.doe@email.com,1000.00,850.00,ACTIVE,HIGH
ACC002,Jane,Smith,jane.smith@email.com,2500.00,2200.00,NEW,MEDIUM
ACC003,Bob,Johnson,bob.johnson@email.com,1500.00,1350.00,ACTIVE,LOW`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk-upload-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Bulk Upload</h1>
          <p className="text-gray-600 mt-2">Import accounts from CSV or Excel files with advanced features</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) loadUploadHistory();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <History className="w-4 h-4" />
            Upload History
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload File</h2>
        
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  setUploadResult(null);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-gray-500 mb-4">or click to browse</p>
              <p className="text-sm text-gray-400">Supports CSV, XLS, XLSX files (max 10MB)</p>
            </div>
          )}
        </div>

        {/* Upload Options */}
        {selectedFile && (
          <div className="mt-6 space-y-4">
            <h3 className="font-medium text-gray-900">Upload Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Name (Optional)
                </label>
                <input
                  type="text"
                  value={uploadOptions.batchName || ''}
                  onChange={(e) =>
                    setUploadOptions({ ...uploadOptions, batchName: e.target.value })
                  }
                  placeholder={`Upload ${new Date().toLocaleDateString()}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={uploadOptions.skipErrors}
                  onChange={(e) =>
                    setUploadOptions({ ...uploadOptions, skipErrors: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Skip errors and continue processing valid records
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={uploadOptions.updateExisting}
                  onChange={(e) =>
                    setUploadOptions({ ...uploadOptions, updateExisting: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Update existing accounts (instead of skipping duplicates)
                </span>
              </label>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload File
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload Results */}
      {uploadResult && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-4">
            {uploadResult.status === 'completed' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">Upload Results</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Records</p>
              <p className="text-2xl font-bold text-blue-900">{uploadResult.totalRecords}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Successful</p>
              <p className="text-2xl font-bold text-green-900">{uploadResult.successfulRecords}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Failed</p>
              <p className="text-2xl font-bold text-red-900">{uploadResult.failedRecords}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Duplicates</p>
              <p className="text-2xl font-bold text-yellow-900">{uploadResult.duplicates}</p>
            </div>
          </div>

          {uploadResult.errors.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                Errors ({uploadResult.errors.length})
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {uploadResult.errors.map((error, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border-l-4 border-red-400">
                    <p className="text-sm">
                      <span className="font-medium">Row {error.row}:</span>{' '}
                      {error.field && <span className="text-gray-500">({error.field})</span>}{' '}
                      {error.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload History */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload History</h2>
          
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : uploadHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upload history found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-medium text-gray-900">File</th>
                    <th className="pb-3 font-medium text-gray-900">Status</th>
                    <th className="pb-3 font-medium text-gray-900">Records</th>
                    <th className="pb-3 font-medium text-gray-900">Success Rate</th>
                    <th className="pb-3 font-medium text-gray-900">Date</th>
                    <th className="pb-3 font-medium text-gray-900">Uploaded By</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadHistory.map((batch) => (
                    <tr key={batch.id} className="border-b">
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-900">{batch.originalFilename}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(batch.fileSize)}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {batch.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3">
                        <p className="text-sm">{batch.totalRecords} total</p>
                        <p className="text-xs text-gray-500">
                          {batch.successCount} success, {batch.errorCount} errors
                        </p>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${batch.totalRecords > 0 ? (batch.successCount / batch.totalRecords) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {batch.totalRecords > 0 ? Math.round((batch.successCount / batch.totalRecords) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-sm text-gray-600">
                        {batch.uploadedBy.firstName} {batch.uploadedBy.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}