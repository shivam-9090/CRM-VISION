'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Shield, Lock, ArrowRight, Camera, Mail, Phone, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const USER_ROLES = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' }
];

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  twoFactorEnabled?: boolean;
  company: {
    id: string;
    name: string;
    description?: string;
  };
}

interface ActivityStats {
  total: number;
  completed: number;
  scheduled: number;
  thisWeek: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchActivityStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        role: response.data.role || 'USER',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      toast.error('Failed to load profile');
    }
  };

  const fetchActivityStats = async () => {
    try {
      const response = await api.get('/activities');
      // Handle paginated response
      const activitiesData = response.data.data || response.data || [];
      const activities = Array.isArray(activitiesData) ? activitiesData : [];
      
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const stats = {
        total: activities.length,
        completed: activities.filter((a: any) => a.status === 'COMPLETED').length,
        scheduled: activities.filter((a: any) => a.status === 'SCHEDULED').length,
        thisWeek: activities.filter((a: any) => new Date(a.scheduledDate) >= oneWeekAgo).length,
      };
      
      setActivityStats(stats);
    } catch (err) {
      console.error('Failed to fetch activity stats:', err);
      // Set default stats on error
      setActivityStats({
        total: 0,
        completed: 0,
        scheduled: 0,
        thisWeek: 0,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await api.patch(`/users/${profile?.id}`, formData);
      setProfile(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully');
      fetchProfile(); // Refresh profile data
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { errors?: Record<string, string>; message?: string } } }).response;
        if (response?.data?.errors) {
          setErrors(response.data.errors);
        } else {
          setErrors({ general: response?.data?.message || 'Failed to update profile' });
        }
      } else {
        setErrors({ general: 'Failed to update profile' });
      }
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      role: profile?.role || 'USER',
    });
    setIsEditing(false);
    setErrors({});
  };

  if (!profile) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 bg-gray-50 min-h-screen animate-fade-in">
          <div className="flex items-center justify-center h-64">
            <div className="text-black">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-50 min-h-screen animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black flex items-center animate-slide-in-left">
            <User className="h-8 w-8 mr-3" />
            User Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your account information and settings</p>
        </div>

        {/* Activity Stats Cards */}
        {activityStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Activities</p>
                    <p className="text-2xl font-bold text-black">{activityStats.total}</p>
                  </div>
                  <Activity className="h-10 w-10 text-blue-500 opacity-75" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{activityStats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-green-500 opacity-75" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scheduled</p>
                    <p className="text-2xl font-bold text-blue-600">{activityStats.scheduled}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-500 opacity-75" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-purple-600">{activityStats.thisWeek}</p>
                  </div>
                  <Activity className="h-10 w-10 text-purple-500 opacity-75" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                      {errors.general}
                    </div>
                  )}
                  
                  <Input
                    label="Full Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="+1 (555) 000-0000"
                  />

                  <Select
                    label="Role *"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    options={USER_ROLES}
                    error={errors.role}
                    required
                    disabled={profile?.role !== 'ADMIN'}
                  />
                  {profile?.role !== 'ADMIN' && (
                    <p className="text-xs text-gray-500">Only admins can change user roles</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" isLoading={loading}>
                      Save Changes
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900 font-medium">{profile?.name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-900">{profile?.phone || 'Not set'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="capitalize text-gray-900">{profile?.role?.toLowerCase()}</span>
                    </div>
                  </div>

                  <Button onClick={() => setIsEditing(true)} className="mt-4">
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">{profile?.email}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <p className="text-gray-900 font-medium">{profile?.company.name}</p>
                  {profile?.company.description && (
                    <p className="text-sm text-gray-500 mt-1">{profile.company.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>

                {profile?.lastLoginAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                    <p className="text-sm text-gray-600">
                      {new Date(profile.lastLoginAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Two-Factor Authentication</label>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${profile?.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-gray-900">{profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-mono break-all select-all">{profile?.id}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Your unique identifier</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Manage your account security settings including two-factor authentication.
                </p>
                <Button 
                  onClick={() => router.push('/profile/security')}
                  variant="outline"
                  className="w-full flex items-center justify-between"
                >
                  <span>Manage Security Settings</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}