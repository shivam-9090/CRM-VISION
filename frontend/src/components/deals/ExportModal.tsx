'use client';

import { useState } from 'react';
import { X, Download, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportRange = 'custom' | 'today' | 'week' | 'month' | 'all';

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [selectedRange, setSelectedRange] = useState<ExportRange>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);

    try {
      let startDate = '';
      let endDate = new Date().toISOString().split('T')[0]; // Today

      // Calculate date ranges based on selection
      const today = new Date();
      
      switch (selectedRange) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          break;
        
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        
        case 'custom':
          if (!customStartDate || !customEndDate) {
            toast.error('Please select both start and end dates');
            setExporting(false);
            return;
          }
          startDate = customStartDate;
          endDate = customEndDate;
          break;
        
        case 'all':
          // No date filter - export all deals
          break;
      }

      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate && selectedRange !== 'all') params.append('endDate', endDate);

      // Call export API
      const response = await api.get(`/export/deals?${params.toString()}`, {
        responseType: 'blob', // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with date range
      const filename = selectedRange === 'all' 
        ? 'deals_export_all.csv'
        : `deals_export_${startDate}_to_${endDate}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Deals exported successfully!');
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export deals');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black flex items-center">
            <Download className="h-6 w-6 mr-2" />
            Export Deals
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Time Range
            </label>
            
            <div className="space-y-2">
              {/* All Time */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="range"
                  value="all"
                  checked={selectedRange === 'all'}
                  onChange={(e) => setSelectedRange(e.target.value as ExportRange)}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-black">All Time</p>
                  <p className="text-sm text-gray-500">Export all deals</p>
                </div>
              </label>

              {/* Today */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="range"
                  value="today"
                  checked={selectedRange === 'today'}
                  onChange={(e) => setSelectedRange(e.target.value as ExportRange)}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-black">Today (Last 24 Hours)</p>
                  <p className="text-sm text-gray-500">Deals created in the last 24 hours</p>
                </div>
              </label>

              {/* Last 7 Days */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="range"
                  value="week"
                  checked={selectedRange === 'week'}
                  onChange={(e) => setSelectedRange(e.target.value as ExportRange)}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-black">Last 7 Days</p>
                  <p className="text-sm text-gray-500">Deals created in the last 7 days</p>
                </div>
              </label>

              {/* Last 30 Days */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="range"
                  value="month"
                  checked={selectedRange === 'month'}
                  onChange={(e) => setSelectedRange(e.target.value as ExportRange)}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <p className="font-medium text-black">Last 30 Days</p>
                  <p className="text-sm text-gray-500">Deals created in the last 30 days</p>
                </div>
              </label>

              {/* Custom Range */}
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="range"
                  value="custom"
                  checked={selectedRange === 'custom'}
                  onChange={(e) => setSelectedRange(e.target.value as ExportRange)}
                  className="mr-3 w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium text-black flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Custom Date Range
                  </p>
                  <p className="text-sm text-gray-500 mb-2">Deals created between specific dates</p>
                  
                  {selectedRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          max={customEndDate || new Date().toISOString().split('T')[0]}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          min={customStartDate}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleExport}
              isLoading={exporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={exporting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
