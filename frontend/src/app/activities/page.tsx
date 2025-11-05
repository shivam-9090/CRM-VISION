'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Search, Filter, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

interface Activity {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: string;
  description?: string;
  createdAt: string;
  contact?: {
    id: string;
    name: string;
  };
  deal?: {
    id: string;
    title: string;
  };
}

const ACTIVITY_TYPES = {
  TASK: 'Task',
  CALL: 'Call',
  MEETING: 'Meeting',
  EMAIL: 'Email',
  NOTE: 'Note'
};

const ACTIVITY_STATUS = {
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  SCHEDULED: Clock,
  COMPLETED: CheckCircle,
  CANCELLED: XCircle
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'TASK', label: 'Task' },
  { value: 'CALL', label: 'Call' },
  { value: 'MEETING', label: 'Meeting' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'NOTE', label: 'Note' }
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' }
];

export default function ActivitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

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
      fetchActivities();
    };
    checkAuth();

    // Refetch activities when page receives focus (e.g., navigating back from create page)
    const handleFocus = () => {
      fetchActivities();
    };

    window.addEventListener('focus', handleFocus);
    
    // Also refetch when visibility changes (user returns to the tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchActivities();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  // Refetch activities when navigating back to this page
  useEffect(() => {
    console.log('📍 Pathname changed to:', pathname);
    if (pathname === '/activities') {
      console.log('✨ Pathname is /activities - refetching...');
      fetchActivities();
    }
  }, [pathname]);

  useEffect(() => {
    // Apply filters whenever activities or filter states change
    let filtered = [...activities];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.contact?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.deal?.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(activity => activity.status === statusFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, searchQuery, typeFilter, statusFilter]);

  const fetchActivities = async () => {
    console.log('🔄 Fetching activities...');
    try {
      const response = await api.get('/activities');
      console.log('📦 Raw API response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data type:', typeof response.data);
      console.log('📦 Is array?:', Array.isArray(response.data));
      
      // Check if response.data has a 'data' property (paginated response)
      const activitiesData = response.data.data || response.data;
      const data = Array.isArray(activitiesData) ? activitiesData : [];
      
      console.log('✅ Activities fetched:', data.length, 'activities');
      console.log('📋 Activities:', data);
      setActivities(data);
      setFilteredActivities(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      console.error('❌ Failed to fetch activities:', errorMessage);
      console.error('❌ Full error:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await api.delete(`/activities/${id}`);
      setActivities(activities.filter(activity => activity.id !== id));
      toast.success('Activity deleted successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/activities/${id}`, { status: newStatus });
      setActivities(activities.map(activity => 
        activity.id === id ? { ...activity, status: newStatus } : activity
      ));
      toast.success(`Activity marked as ${newStatus.toLowerCase()}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedActivities.length === 0) {
      toast.error('No activities selected');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedActivities.length} activities?`)) return;

    try {
      await Promise.all(
        selectedActivities.map(id => api.delete(`/activities/${id}`))
      );
      setActivities(activities.filter(activity => !selectedActivities.includes(activity.id)));
      setSelectedActivities([]);
      toast.success(`${selectedActivities.length} activities deleted`);
    } catch (err) {
      toast.error('Failed to delete some activities');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedActivities.length === 0) {
      toast.error('No activities selected');
      return;
    }

    try {
      await Promise.all(
        selectedActivities.map(id => api.patch(`/activities/${id}`, { status: newStatus }))
      );
      setActivities(activities.map(activity =>
        selectedActivities.includes(activity.id) ? { ...activity, status: newStatus } : activity
      ));
      setSelectedActivities([]);
      toast.success(`${selectedActivities.length} activities updated`);
    } catch (err) {
      toast.error('Failed to update some activities');
    }
  };

  const toggleSelectActivity = (id: string) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(actId => actId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedActivities.length === filteredActivities.length) {
      setSelectedActivities([]);
    } else {
      setSelectedActivities(filteredActivities.map(a => a.id));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-50 min-h-screen animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black animate-slide-in-left">Activities</h1>
            <p className="text-gray-600 mt-1">
              {filteredActivities.length} of {activities.length} activities {loading && '(Loading...)'}
            </p>
          </div>
          <Link href="/activities/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search & Filters
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search activities by title, description, contact, or deal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <Select
                    label="Type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    options={TYPE_FILTER_OPTIONS}
                  />
                  <Select
                    label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={STATUS_FILTER_OPTIONS}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedActivities.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-900">
                  {selectedActivities.length} {selectedActivities.length === 1 ? 'activity' : 'activities'} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('COMPLETED')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    Mark Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('CANCELLED')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    Mark Cancelled
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedActivities([])}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  {activities.length === 0 
                    ? 'No activities found' 
                    : 'No activities match your filters'}
                </p>
                {activities.length === 0 ? (
                  <Link href="/activities/create">
                    <Button>Create your first activity</Button>
                  </Link>
                ) : (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedActivities.length === filteredActivities.length && filteredActivities.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Array.isArray(filteredActivities) ? filteredActivities : []).map((activity) => {
                    const StatusIcon = STATUS_ICONS[activity.status as keyof typeof STATUS_ICONS];
                    const isSelected = selectedActivities.includes(activity.id);
                    
                    return (
                      <TableRow key={activity.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectActivity(activity.id)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div className="text-gray-900">{activity.title}</div>
                            {activity.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {activity.description.length > 60 
                                  ? `${activity.description.substring(0, 60)}...` 
                                  : activity.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS]}`}>
                              {ACTIVITY_STATUS[activity.status as keyof typeof ACTIVITY_STATUS]}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(activity.scheduledDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {activity.contact && (
                              <div className="text-gray-600">
                                <span className="font-medium">Contact:</span> {activity.contact.name}
                              </div>
                            )}
                            {activity.deal && (
                              <div className="text-gray-600">
                                <span className="font-medium">Deal:</span> {activity.deal.title}
                              </div>
                            )}
                            {!activity.contact && !activity.deal && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {activity.status === 'SCHEDULED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(activity.id, 'COMPLETED')}
                                className="text-green-600 hover:text-green-700"
                                title="Mark as completed"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Link href={`/activities/edit/${activity.id}`}>
                              <Button variant="ghost" size="sm" title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(activity.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}