'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import { Plus, Edit, Trash2, Calendar, X, Download, Grip, LayoutGrid, List } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: string;
  leadSource?: string;
  leadScore?: number;
  priority?: string;
  expectedCloseDate?: string;
  closedAt?: string;
  lastContactDate?: string;
  notes?: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  company: {
    id: string;
    name: string;
  };
  createdAt: string;
  recentActivities?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    scheduledDate: string;
  }>;
}

interface PipelineStats {
  stage: string;
  count: number;
  totalValue: number;
  avgLeadScore: number;
}

interface MyDealsStats {
  total: number;
  won: number;
  lost: number;
  inProgress: number;
  winRate: number;
}

// Consistent stage configuration
const DEAL_STAGE_CONFIG = {
  LEAD: { label: 'New Lead', color: 'bg-cyan-400', cardColor: 'bg-cyan-100 border-l-4 border-cyan-400' },
  QUALIFIED: { label: 'Qualified', color: 'bg-orange-400', cardColor: 'bg-orange-100 border-l-4 border-orange-400' },
  PROPOSAL: { label: 'Proposal', color: 'bg-yellow-400', cardColor: 'bg-yellow-100 border-l-4 border-yellow-400' },
  NEGOTIATION: { label: 'Negotiation', color: 'bg-purple-400', cardColor: 'bg-purple-100 border-l-4 border-purple-400' },
  CLOSED_WON: { label: 'Won', color: 'bg-green-500', cardColor: 'bg-green-100 border-l-4 border-green-500' },
  CLOSED_LOST: { label: 'Lost', color: 'bg-red-400', cardColor: 'bg-red-100 border-l-4 border-red-400' },
};

interface StageColumn {
  key: string;
  label: string;
  color: string;
  cardColor: string;
  deals: Deal[];
}

// Generate columns from config
const STAGE_COLUMNS: StageColumn[] = Object.entries(DEAL_STAGE_CONFIG).map(([key, config]) => ({
  key,
  label: config.label,
  color: config.color,
  cardColor: config.cardColor,
  deals: []
}));

// Generate options from config
const STAGE_OPTIONS = Object.entries(DEAL_STAGE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label
}));

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [organizedDeals, setOrganizedDeals] = useState<StageColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  
  // ✅ NEW: Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  
  // ✅ NEW: Bulk operations state
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // ✅ NEW: Export loading state
  const [exportLoading, setExportLoading] = useState(false);
  const [assigningDeals, setAssigningDeals] = useState(false);
  
  // Analytics state
  const [pipelineStats, setPipelineStats] = useState<PipelineStats[]>([]);
  const [myStats, setMyStats] = useState<MyDealsStats | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  // Filtering state
  const [filters, setFilters] = useState({
    stage: '',
    priority: '',
    search: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);
  const limit = 50;
  
  // ✅ NEW: View mode state (card/list)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: '',
    expectedCloseDate: '',
    notes: '',
    priority: ''
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const hasToken = hasAuthToken();
        
        if (hasToken) {
          console.log('💼 Deals: Local token found, verifying with backend...');
          const isValid = await verifyAuthToken();
          
          if (!isValid) {
            console.log('💼 Deals: Invalid token, redirecting to login');
            router.push('/auth/login');
          }
        } else {
          console.log('💼 Deals: No token found, redirecting to login');
          router.push('/auth/login');
        }
      }
    };
    checkAuth();
  }, [router]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (detailModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [detailModalOpen]);

  const fetchDeals = useCallback(async () => {
    try {
      // Build query params
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', limit.toString());
      
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get(`/deals?${params.toString()}`);
      
      // Handle paginated response
      const fetchedDeals = response.data.data || response.data;
      const meta = response.data.meta;
      
      if (meta) {
        setTotalPages(meta.totalPages);
        setTotalDeals(meta.total);
      }
      
      setDeals(fetchedDeals);
      
      // Organize deals by stage
      const organized = STAGE_COLUMNS.map(column => ({
        ...column,
        deals: fetchedDeals.filter((deal: Deal) => deal.stage === column.key)
      }));
      setOrganizedDeals(organized);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch deals';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, filters]);

  const fetchAnalytics = useCallback(async () => {
    try {
      console.log('Fetching analytics...');
      const [pipelineResponse, myDealsResponse] = await Promise.all([
        api.get('/deals/stats/pipeline'),
        api.get('/deals/stats/my-deals')
      ]);
      
      console.log('Pipeline stats response:', pipelineResponse.data);
      console.log('My deals stats response:', myDealsResponse.data);
      
      setPipelineStats(pipelineResponse.data || []);
      setMyStats(myDealsResponse.data || { total: 0, won: 0, lost: 0, inProgress: 0, winRate: 0 });
    } catch (err: unknown) {
      console.error('Failed to fetch analytics:', err);
      // Set default values on error
      setPipelineStats([]);
      setMyStats({ total: 0, won: 0, lost: 0, inProgress: 0, winRate: 0 });
    }
  }, []);

  // Authentication check - only run once on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const hasToken = hasAuthToken();
        if (!hasToken) {
          router.push('/auth/login');
          return;
        }
        
        const isValid = await verifyAuthToken();
        if (!isValid) {
          router.push('/auth/login');
          return;
        }
      }
      // Initial data fetch
      fetchDeals();
      fetchAnalytics();
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]); // Only run on mount and when router changes

  // Refetch when filters or page changes (debounced for search)
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        fetchDeals();
      }, 300); // Debounce search by 300ms to prevent too many API calls
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, limit]); // Only depend on the actual filter values, not the function

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filtering
    fetchDeals();
  };

  const handleClearFilters = () => {
    setFilters({ stage: '', priority: '', search: '' });
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      await api.delete(`/deals/${id}`);
      setDeals(deals.filter(deal => deal.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deal';
      setError(errorMessage);
    }
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    const originalDeals = [...deals]; // Save for rollback
    
    // Optimistic update
    const updatedDeals = deals.map(deal => 
      deal.id === dealId ? { ...deal, stage: newStage } : deal
    );
    setDeals(updatedDeals);
    
    // Re-organize optimistically
    const organized = STAGE_COLUMNS.map(column => ({
      ...column,
      deals: updatedDeals.filter((deal: Deal) => deal.stage === column.key)
    }));
    setOrganizedDeals(organized);
    
    setUpdatingStage(dealId);
    
    try {
      const response = await api.put(`/deals/${dealId}`, { stage: newStage });
      
      // Update with server response
      const serverUpdatedDeals = deals.map(deal => 
        deal.id === dealId ? { ...deal, ...response.data } : deal
      );
      setDeals(serverUpdatedDeals);
      
      const serverOrganized = STAGE_COLUMNS.map(column => ({
        ...column,
        deals: serverUpdatedDeals.filter((deal: Deal) => deal.stage === column.key)
      }));
      setOrganizedDeals(serverOrganized);
      
      // Refresh analytics after stage change
      fetchAnalytics();
    } catch (err: unknown) {
      // Rollback on error
      setDeals(originalDeals);
      const rolledBackOrganized = STAGE_COLUMNS.map(column => ({
        ...column,
        deals: originalDeals.filter((deal: Deal) => deal.stage === column.key)
      }));
      setOrganizedDeals(rolledBackOrganized);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to update stage';
      setError(errorMessage);
    } finally {
      setUpdatingStage(null);
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title || '',
      value: deal.value?.toString() || '',
      stage: deal.stage || '',
      expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split('T')[0] : '',
      notes: deal.notes || '',
      priority: deal.priority || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingDeal) return;

    try {
      const updateData: {
        title?: string;
        value?: number;
        stage?: string;
        expectedCloseDate?: string;
        notes?: string;
        priority?: string;
      } = {};
      
      if (formData.title) updateData.title = formData.title;
      if (formData.value) updateData.value = parseFloat(formData.value);
      if (formData.stage) updateData.stage = formData.stage;
      if (formData.expectedCloseDate) updateData.expectedCloseDate = formData.expectedCloseDate;
      if (formData.notes) updateData.notes = formData.notes;
      if (formData.priority) updateData.priority = formData.priority;

      const response = await api.put(`/deals/${editingDeal.id}`, updateData);
      
      // Update local deals state
      const updatedDeals = deals.map(deal => 
        deal.id === editingDeal.id ? { ...deal, ...response.data } : deal
      );
      setDeals(updatedDeals);
      
      // Re-organize deals by stage
      const organized = STAGE_COLUMNS.map(column => ({
        ...column,
        deals: updatedDeals.filter((deal: Deal) => deal.stage === column.key)
      }));
      setOrganizedDeals(organized);
      
      // Refresh analytics
      fetchAnalytics();
      
      // Close modal
      setEditModalOpen(false);
      setEditingDeal(null);
    } catch (err: unknown) {
      console.error('Error updating deal:', err);
      let errorMessage = 'Failed to update deal';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  // ✅ NEW: Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid destination
    if (!destination) return;

    // Dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Get the new stage
    const newStage = destination.droppableId;
    
    // Update the stage
    await handleStageChange(draggableId, newStage);
  };

  // ✅ NEW: Fetch deal details
  const handleViewDetails = async (dealId: string) => {
    setLoadingDetails(true);
    setDetailModalOpen(true);

    try {
      const response = await api.get(`/deals/${dealId}/details`);
      setSelectedDeal(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load deal details';
      setError(errorMessage);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ✅ NEW: Toggle deal selection
  const toggleDealSelection = (dealId: string) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDeals(newSelected);
  };

  // ✅ NEW: Bulk delete
  const handleBulkDelete = async () => {
    if (selectedDeals.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDeals.size} deal(s)?`)) return;

    setBulkActionLoading(true);
    try {
      await api.post('/deals/bulk/delete', {
        dealIds: Array.from(selectedDeals)
      });

      // Remove deleted deals from state
      const remainingDeals = deals.filter(d => !selectedDeals.has(d.id));
      setDeals(remainingDeals);
      setSelectedDeals(new Set());
      
      // Refresh data
      await fetchDeals();
      await fetchAnalytics();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deals';
      setError(errorMessage);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ✅ NEW: Bulk update stage
  const handleBulkUpdateStage = async (newStage: string) => {
    if (selectedDeals.size === 0) return;

    setBulkActionLoading(true);
    try {
      await api.put('/deals/bulk/update', {
        dealIds: Array.from(selectedDeals),
        stage: newStage
      });

      setSelectedDeals(new Set());
      
      // Refresh data
      await fetchDeals();
      await fetchAnalytics();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deals';
      setError(errorMessage);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ✅ NEW: Bulk update priority
  const handleBulkUpdatePriority = async (newPriority: string) => {
    if (selectedDeals.size === 0) return;

    setBulkActionLoading(true);
    try {
      await api.put('/deals/bulk/update', {
        dealIds: Array.from(selectedDeals),
        priority: newPriority
      });

      setSelectedDeals(new Set());
      
      // Refresh data
      await fetchDeals();
      await fetchAnalytics();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deals';
      setError(errorMessage);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // ✅ NEW: Export to CSV
  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      // Build query params (same as filters)
      const params = new URLSearchParams();
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/deals/export/csv?${params.toString()}`, {
        responseType: 'blob' // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `deals-export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export deals';
      setError(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  // ✅ NEW: Save notes
  const handleSaveNotes = async () => {
    if (!selectedDeal) return;
    
    setSavingNotes(true);
    try {
      await api.put(`/deals/${selectedDeal.id}`, { notes: notesValue });
      
      // Update local state
      setSelectedDeal({ ...selectedDeal, notes: notesValue });
      setDeals(deals.map(d => d.id === selectedDeal.id ? { ...d, notes: notesValue } : d));
      setEditingNotes(false);
      
      alert('Notes saved successfully!');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save notes';
      alert(errorMessage);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 bg-gray-50 min-h-screen animate-fade-in">
          <div className="text-center text-black">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-50 overflow-y-auto animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black animate-slide-in-left">Deals Pipeline</h1>
          <div className="flex gap-2">
            {/* ✅ NEW: View Toggle Buttons */}
            <div className="flex gap-1 bg-white border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Card
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>
            
            {/* ✅ Export CSV Button */}
            <Button 
              onClick={handleExportCSV}
              disabled={exportLoading}
              variant="secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Link href="/deals/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </Link>
          </div>
        </div>

        {/* ✅ NEW: Bulk Action Bar */}
        {selectedDeals.size > 0 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">
                {selectedDeals.size} deal(s) selected
              </span>
              <button
                onClick={() => setSelectedDeals(new Set())}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Selection
              </button>
            </div>
            <div className="flex gap-2">
              <select
                onChange={(e) => e.target.value && handleBulkUpdateStage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                defaultValue=""
                disabled={bulkActionLoading}
              >
                <option value="">Change Stage...</option>
                {STAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <select
                onChange={(e) => e.target.value && handleBulkUpdatePriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                defaultValue=""
                disabled={bulkActionLoading}
              >
                <option value="">Change Priority...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              <Button 
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                variant="danger"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {bulkActionLoading ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Analytics Dashboard */}
        {showAnalytics && myStats && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-800">My Deals Overview</h2>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Hide Stats
              </button>
            </div>
            {myStats.total === 0 ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">No deals assigned to you yet</p>
                <p className="text-sm mt-1">
                  Create a new deal and it will be automatically assigned to you, or 
                  <button 
                    onClick={async () => {
                      setAssigningDeals(true);
                      try {
                        // Get current user from localStorage
                        const userData = localStorage.getItem('user');
                        if (!userData) {
                          alert('Failed to get current user. Please refresh and try again.');
                          return;
                        }
                        const user = JSON.parse(userData);
                        
                        console.log('Current user:', user);
                        console.log('Total deals to assign:', deals.length);
                        
                        // Update all deals without assignedTo to current user
                        const unassignedDeals = deals.filter(d => !d.assignedTo);
                        console.log('Unassigned deals:', unassignedDeals.length);
                        
                        if (unassignedDeals.length === 0) {
                          alert('No unassigned deals found. Try creating a new deal.');
                          return;
                        }
                        
                        // Update deals one by one
                        for (const deal of unassignedDeals) {
                          console.log(`Assigning deal ${deal.id} to user ${user.id}`);
                          await api.put(`/deals/${deal.id}`, { assignedToId: user.id });
                        }
                        
                        console.log('All deals assigned successfully');
                        
                        // Refresh data
                        await fetchDeals();
                        await fetchAnalytics();
                        
                        alert(`Successfully assigned ${unassignedDeals.length} deals to you!`);
                      } catch (error) {
                        console.error('Failed to assign deals:', error);
                        alert('Failed to assign deals. Check console for details.');
                      } finally {
                        setAssigningDeals(false);
                      }
                    }}
                    disabled={assigningDeals}
                    className="text-blue-600 hover:text-blue-800 underline ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {assigningDeals ? 'assigning...' : 'click here to assign all existing deals to yourself'}
                  </button>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-4 mb-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-600 font-semibold">Total Deals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-700">{myStats.total}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-600 font-semibold">Won</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">{myStats.won}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-yellow-700 font-semibold">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-yellow-700">{myStats.inProgress}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-red-600 font-semibold">Lost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700">{myStats.lost}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-purple-600 font-semibold">Win Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-700">{myStats.winRate}%</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {!showAnalytics && myStats && (
          <button
            onClick={() => setShowAnalytics(true)}
            className="mb-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Show Analytics
          </button>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Deals
                </label>
                <input
                  type="text"
                  placeholder="Search by title or notes..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stage
                </label>
                <select
                  value={filters.stage}
                  onChange={(e) => setFilters({...filters, stage: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Stages</option>
                  {STAGE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
                {(filters.search || filters.stage || filters.priority) && (
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {totalDeals > 0 && (
              <div className="mt-3 text-sm text-gray-600">
                Showing {deals.length} of {totalDeals} deals
                {(filters.search || filters.stage || filters.priority) && ' (filtered)'}
              </div>
            )}
          </CardContent>
        </Card>

        {deals.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-black font-semibold mb-4 text-lg">
                {(filters.search || filters.stage || filters.priority) 
                  ? 'No deals match your filters' 
                  : 'No deals found'}
              </p>
              <p className="text-gray-600 mb-6">
                {(filters.search || filters.stage || filters.priority)
                  ? 'Try adjusting your filters or clear them to see all deals'
                  : 'Start tracking your first deal to see it here'}
              </p>
              {!(filters.search || filters.stage || filters.priority) && (
                <Link href="/deals/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first deal
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pipeline Stats by Stage */}
            {pipelineStats.length > 0 && (
              <div className="mb-4 grid grid-cols-5 gap-4">
                {organizedDeals.map((column) => {
                  const stat = pipelineStats.find(s => s.stage === column.key);
                  return (
                    <div key={column.key} className="text-sm text-gray-600 bg-white p-2 rounded border">
                      <div className="font-semibold">{column.label}</div>
                      {stat && (
                        <>
                          <div className="text-xs">Value: ${stat.totalValue.toLocaleString()}</div>
                          <div className="text-xs">Avg Score: {Math.round(stat.avgLeadScore)}</div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* ✅ IMPROVED: Kanban Board with Drag and Drop (Card View) */}
            {viewMode === 'card' ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-5 gap-4 h-[calc(100vh-450px)]">
                {organizedDeals.map((column) => (
                  <div key={column.key} className="flex flex-col">
                    {/* Column Header */}
                    <div className={`${column.color} text-white font-bold text-center py-4 text-lg tracking-wide flex justify-between items-center px-4`}>
                      <span>{column.label}</span>
                      {/* ✅ NEW: Select All in Column */}
                      <input
                        type="checkbox"
                        checked={column.deals.length > 0 && column.deals.every(d => selectedDeals.has(d.id))}
                        onChange={() => {
                          const columnDealIds = column.deals.map(d => d.id);
                          const allSelected = columnDealIds.every(id => selectedDeals.has(id));
                          const newSelected = new Set(selectedDeals);
                          columnDealIds.forEach(id => {
                            if (allSelected) newSelected.delete(id);
                            else newSelected.add(id);
                          });
                          setSelectedDeals(newSelected);
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </div>
                    
                    {/* Column Content - Droppable */}
                    <Droppable droppableId={column.key}>
                      {(provided, snapshot) => (
                        <div 
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`bg-white flex-1 p-2 grid grid-cols-1 gap-1 overflow-y-auto border-l border-r border-b border-gray-200 ${
                            snapshot.isDraggingOver ? 'bg-blue-50' : ''
                          }`}
                        >
                          {column.deals.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`${column.cardColor} rounded-lg p-2.5 shadow-sm hover:shadow-md transition-all duration-200 w-full aspect-square flex flex-col justify-between ${
                                    snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-400' : ''
                                  }`}
                                >
                                  <div className="flex-1 overflow-hidden">
                                    {/* ✅ NEW: Drag Handle + Checkbox */}
                                    <div className="flex justify-between items-center mb-1.5">
                                      <div {...provided.dragHandleProps} className="cursor-move text-gray-400 hover:text-gray-600">
                                        <Grip className="h-4 w-4" />
                                      </div>
                                      <input
                                        type="checkbox"
                                        checked={selectedDeals.has(deal.id)}
                                        onChange={() => toggleDealSelection(deal.id)}
                                        className="w-4 h-4 cursor-pointer"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>

                                    {/* Name - Always shown */}
                                    <div className="mb-1.5">
                                      <div className="text-xs font-semibold text-gray-500 uppercase">Name:</div>
                                      <button 
                                        onClick={() => handleViewDetails(deal.id)}
                                        className="font-bold text-black text-sm truncate leading-tight hover:text-blue-600 text-left w-full"
                                      >
                                        {deal.title || 'No Name'}
                                      </button>
                                    </div>
                                    
                                    {/* Status - Always shown */}
                                    <div className="mb-1.5">
                                      <div className="text-xs font-semibold text-gray-500 uppercase">Status:</div>
                                      <Select
                                        value={deal.stage}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStageChange(deal.id, e.target.value)}
                                        options={STAGE_OPTIONS}
                                        className="text-xs bg-white text-black font-medium w-full"
                                        disabled={updatingStage === deal.id}
                                      />
                                    </div>
                                    
                                    {/* Company Name - Always reserve space */}
                                    <div className="mb-1.5">
                                      <div className="text-xs font-semibold text-gray-500 uppercase">Company Name:</div>
                                      <div className="font-semibold text-black text-xs truncate leading-tight">{deal.company?.name || 'No Company'}</div>
                                    </div>
                                    
                                    {/* Value - Always reserve space */}
                                    <div className="mb-1.5">
                                      <div className="text-xs font-semibold text-gray-500 uppercase">Value:</div>
                                      <div className="font-bold text-green-700 text-xs truncate">
                                        {deal.value ? `$${deal.value.toLocaleString()}` : 'No Value'}
                                      </div>
                                    </div>
                                    
                                    {/* CD (Close Date) - Always reserve space */}
                                    <div className="mb-1.5">
                                      <div className="text-xs font-semibold text-gray-500 uppercase flex items-center">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Close Date:
                                      </div>
                                      <div className="font-semibold text-blue-700 text-xs">
                                        {(deal.expectedCloseDate || deal.closedAt) 
                                          ? new Date(deal.closedAt || deal.expectedCloseDate!).toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric',
                                              year: 'numeric'
                                            })
                                          : 'Not Set'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Actions - Always at bottom */}
                                  <div className="flex gap-2 pt-2 border-t border-gray-300">
                                    <button 
                                      onClick={() => handleEdit(deal)}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs font-medium"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(deal.id)}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs font-medium"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {/* Empty State */}
                          {column.deals.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                              <div className="text-sm font-medium">No {column.label} deals</div>
                              <div className="text-xs mt-1">Deals will appear here</div>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
            ) : (
            /* ✅ NEW: List View */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={deals.length > 0 && deals.every(d => selectedDeals.has(d.id))}
                        onChange={() => {
                          const allSelected = deals.every(d => selectedDeals.has(d.id));
                          const newSelected = new Set(selectedDeals);
                          deals.forEach(d => {
                            if (allSelected) newSelected.delete(d.id);
                            else newSelected.add(d.id);
                          });
                          setSelectedDeals(newSelected);
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deal Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Close Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deals.map((deal) => (
                    <tr key={deal.id} className={`hover:opacity-90 border-l-4 ${
                      deal.stage === 'CLOSED_WON' ? 'border-green-500 bg-green-50' :
                      deal.stage === 'CLOSED_LOST' ? 'border-red-400 bg-red-50' :
                      deal.stage === 'NEGOTIATION' ? 'border-purple-400 bg-purple-50' :
                      deal.stage === 'PROPOSAL' ? 'border-yellow-400 bg-yellow-50' :
                      deal.stage === 'QUALIFIED' ? 'border-orange-400 bg-orange-50' :
                      'border-cyan-400 bg-cyan-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedDeals.has(deal.id)}
                          onChange={() => toggleDealSelection(deal.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => handleViewDetails(deal.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          {deal.title}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.company?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-700">
                          ${deal.value ? deal.value.toLocaleString() : '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          deal.stage === 'CLOSED_WON' ? 'bg-green-100 text-green-800' :
                          deal.stage === 'CLOSED_LOST' ? 'bg-red-100 text-red-800' :
                          deal.stage === 'NEGOTIATION' ? 'bg-purple-100 text-purple-800' :
                          deal.stage === 'PROPOSAL' ? 'bg-yellow-100 text-yellow-800' :
                          deal.stage === 'QUALIFIED' ? 'bg-orange-100 text-orange-800' :
                          'bg-cyan-100 text-cyan-800'
                        }`}>
                          {DEAL_STAGE_CONFIG[deal.stage as keyof typeof DEAL_STAGE_CONFIG]?.label || deal.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          deal.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          deal.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          deal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.priority || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(deal.expectedCloseDate || deal.closedAt) 
                          ? new Date(deal.closedAt || deal.expectedCloseDate!).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deal.assignedTo?.name || 'Unassigned'}</div>
                        {deal.assignedTo?.email && (
                          <div className="text-xs text-gray-500">{deal.assignedTo.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(deal)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                >
                  Next
                </button>
                
                <span className="text-sm text-gray-600 ml-2">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Edit Deal</h2>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Deal Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deal Name *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal name"
                />
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deal Value
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal value"
                />
              </div>

              {/* Stage */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stage *
                </label>
                <Select
                  value={formData.stage}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, stage: e.target.value })}
                  options={STAGE_OPTIONS}
                  className="w-full"
                />
              </div>

              {/* Expected Close Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Priority</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Lead Score - Read Only (Auto-calculated) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lead Score (Auto-calculated)
                </label>
                <input
                  type="number"
                  value={editingDeal?.leadScore || 0}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed text-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated based on value, stage, priority, and source
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal notes or description"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Deal Detail Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">Deal Details</h2>
              <button 
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedDeal(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6 min-h-0">
              {loadingDetails ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading deal details...</p>
              </div>
            ) : selectedDeal ? (
              <div className="space-y-6">
                {/* Overview Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Deal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Deal Title</label>
                        <p className="text-gray-900 font-medium">{selectedDeal.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Value</label>
                        <p className="text-green-700 font-bold text-xl">
                          ${selectedDeal.value ? Number(selectedDeal.value).toLocaleString() : '0'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Stage</label>
                        <p className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {DEAL_STAGE_CONFIG[selectedDeal.stage as keyof typeof DEAL_STAGE_CONFIG]?.label || selectedDeal.stage}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Priority</label>
                        <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          selectedDeal.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          selectedDeal.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          selectedDeal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedDeal.priority || 'Not Set'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Lead Score</label>
                        <p className="text-gray-900 font-medium">{selectedDeal.leadScore || 0}/100</p>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Lead Source</label>
                        <p className="text-gray-900">{selectedDeal.leadSource || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Contact & Company</h3>
                    <div className="space-y-3">
                      {selectedDeal.company && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">Company</label>
                          <p className="text-gray-900 font-medium">{selectedDeal.company.name}</p>
                        </div>
                      )}
                      {selectedDeal.contact && (
                        <>
                          <div>
                            <label className="text-sm font-semibold text-gray-600">Contact Name</label>
                            <p className="text-gray-900">{selectedDeal.contact.firstName} {selectedDeal.contact.lastName}</p>
                          </div>
                          {selectedDeal.contact.email && (
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Email</label>
                              <p className="text-gray-900">{selectedDeal.contact.email}</p>
                            </div>
                          )}
                          {selectedDeal.contact.phone && (
                            <div>
                              <label className="text-sm font-semibold text-gray-600">Phone</label>
                              <p className="text-gray-900">{selectedDeal.contact.phone}</p>
                            </div>
                          )}
                        </>
                      )}
                      {selectedDeal.assignedTo && (
                        <div>
                          <label className="text-sm font-semibold text-gray-600">Assigned To</label>
                          <p className="text-gray-900">{selectedDeal.assignedTo.name}</p>
                          <p className="text-sm text-gray-600">{selectedDeal.assignedTo.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Important Dates</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedDeal.expectedCloseDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Expected Close Date</label>
                        <p className="text-gray-900">{new Date(selectedDeal.expectedCloseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedDeal.closedAt && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Closed At</label>
                        <p className="text-gray-900">{new Date(selectedDeal.closedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedDeal.lastContactDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600">Last Contact</label>
                        <p className="text-gray-900">{new Date(selectedDeal.lastContactDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section - NOW EDITABLE */}
                <div>
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Notes</h3>
                    {!editingNotes ? (
                      <button
                        onClick={() => {
                          setEditingNotes(true);
                          setNotesValue(selectedDeal.notes || '');
                        }}
                        className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit Notes
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNotes}
                          disabled={savingNotes}
                          className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {savingNotes ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(false);
                            setNotesValue('');
                          }}
                          className="text-sm px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {editingNotes ? (
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter notes for this deal..."
                    />
                  ) : (
                    <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg min-h-[100px]">
                      {selectedDeal.notes || 'No notes yet. Click "Edit Notes" to add notes.'}
                    </div>
                  )}
                </div>

                {/* Recent Activities */}
                {selectedDeal.recentActivities && selectedDeal.recentActivities.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Recent Activities</h3>
                    <div className="space-y-2">
                      {selectedDeal.recentActivities.map((activity: { id: string; title: string; type: string; status: string; scheduledDate: string }) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-600">
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 mr-2">
                                {activity.type}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                activity.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {activity.status}
                              </span>
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{new Date(activity.scheduledDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-600">
                <p>No deal details available</p>
              </div>
            )}
            </div>

            {/* Modal Footer - Fixed */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedDeal(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Close
              </button>
              {selectedDeal && (
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleEdit(selectedDeal);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Deal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}