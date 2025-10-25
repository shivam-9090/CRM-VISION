'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Activity {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledDate: string;
  description?: string;
  createdAt: string;
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

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/auth/login');
        return;
      }
      fetchActivities();
    };
    checkAuth();
  }, [router]);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      await api.delete(`/activities/${id}`);
      setActivities(activities.filter(activity => activity.id !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete activity';
      setError(errorMessage);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/activities/${id}`, { status: newStatus });
      setActivities(activities.map(activity => 
        activity.id === id ? { ...activity, status: newStatus } : activity
      ));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update activity';
      setError(errorMessage);
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
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-50 min-h-screen animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black animate-slide-in-left">Activities</h1>
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

        <Card>
          <CardHeader>
            <CardTitle>All Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No activities found</p>
                <Link href="/activities/create">
                  <Button>Create your first activity</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => {
                    const StatusIcon = STATUS_ICONS[activity.status as keyof typeof STATUS_ICONS];
                    return (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.title}</TableCell>
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
                          {new Date(activity.scheduledDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {activity.description ? (
                            <span className="text-sm text-gray-600">
                              {activity.description.length > 50 
                                ? `${activity.description.substring(0, 50)}...` 
                                : activity.description}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {activity.status === 'SCHEDULED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(activity.id, 'COMPLETED')}
                                className="text-green-600 hover:text-green-700"
                              >
                                Complete
                              </Button>
                            )}
                            <Link href={`/activities/${activity.id}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(activity.id)}
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