'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Shield, ArrowRight, Camera, Mail, Phone, Calendar, Activity, CheckCircle2, Lock, Smartphone } from 'lucide-react';
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
  const [twoFactorQR, setTwoFactorQR] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);

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

  const handleEnable2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const response = await api.post('/auth/2fa/enable');
      setTwoFactorQR(response.data.qrCode);
      setTwoFactorSecret(response.data.secret);
      setShowTwoFactorSetup(true);
      toast.success('Scan the QR code with your authenticator app');
    } catch (err: any) {
      console.error('Failed to generate 2FA:', err);
      toast.error(err.response?.data?.message || 'Failed to generate 2FA code');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setTwoFactorLoading(true);
    try {
      await api.post('/auth/2fa/verify', { token: verificationCode });
      toast.success('Two-Factor Authentication enabled successfully!');
      setShowTwoFactorSetup(false);
      setVerificationCode('');
      setTwoFactorQR(null);
      setTwoFactorSecret(null);
      fetchProfile(); // Refresh profile to show updated 2FA status
    } catch (err: any) {
      console.error('Failed to verify 2FA:', err);
      toast.error(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Please enter your password to disable Two-Factor Authentication:');
    
    if (!password) {
      return; // User cancelled
    }

    setTwoFactorLoading(true);
    try {
      await api.post('/auth/2fa/disable', { password });
      toast.success('Two-Factor Authentication disabled');
      fetchProfile(); // Refresh profile
    } catch (err: any) {
      console.error('Failed to disable 2FA:', err);
      toast.error(err.response?.data?.message || 'Failed to disable 2FA. Please check your password.');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCancel2FASetup = () => {
    setShowTwoFactorSetup(false);
    setVerificationCode('');
    setTwoFactorQR(null);
    setTwoFactorSecret(null);
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

                {/* Two-Factor Authentication - Only show for MANAGER and ADMIN */}
                {(profile?.role === 'MANAGER' || profile?.role === 'ADMIN') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Two-Factor Authentication</label>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${profile?.twoFactorEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-900">{profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Setup - Only for MANAGER and ADMIN */}
          {(profile?.role === 'MANAGER' || profile?.role === 'ADMIN') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Two-Factor Authentication Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showTwoFactorSetup ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Lock className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">
                            {profile?.twoFactorEnabled ? 'Two-Factor Authentication is Active' : 'Enhance Your Account Security'}
                          </h4>
                          <p className="text-sm text-blue-800">
                            {profile?.twoFactorEnabled 
                              ? 'Your account is protected with two-factor authentication. You can disable it at any time.'
                              : 'Add an extra layer of security by enabling two-factor authentication. You\'ll need an authenticator app like Google Authenticator or Authy.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {profile?.twoFactorEnabled ? (
                      <Button
                        onClick={handleDisable2FA}
                        isLoading={twoFactorLoading}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Disable Two-Factor Authentication
                      </Button>
                    ) : (
                      <Button
                        onClick={handleEnable2FA}
                        isLoading={twoFactorLoading}
                        className="w-full"
                      >
                        Enable Two-Factor Authentication
                      </Button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Step 1: Scan QR Code</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Open your authenticator app and scan this QR code:
                      </p>
                      {twoFactorQR && (
                        <div className="flex justify-center bg-white p-4 rounded border border-gray-300">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={twoFactorQR} alt="2FA QR Code" className="w-48 h-48" />
                        </div>
                      )}
                      {twoFactorSecret && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Or enter this code manually:</p>
                          <code className="block bg-white px-3 py-2 rounded border border-gray-300 text-sm font-mono text-center select-all">
                            {twoFactorSecret}
                          </code>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Step 2: Enter Verification Code</h4>
                      <Input
                        label="6-Digit Code"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        required
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel2FASetup}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        isLoading={twoFactorLoading}
                        className="flex-1"
                      >
                        Verify & Enable
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}