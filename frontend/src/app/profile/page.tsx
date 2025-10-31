'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { User, Shield } from 'lucide-react';

const USER_ROLES = [
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' }
];

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  company: {
    id: string;
    name: string;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        role: response.data.role || 'USER',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
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
      const response = await api.patch('/user/profile', formData);
      setProfile(response.data);
      setIsEditing(false);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
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

                  <Select
                    label="Role *"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    options={USER_ROLES}
                    error={errors.role}
                    required
                  />

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
                    <p className="text-gray-900">{profile.name || 'Not set'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="capitalize text-gray-900">{profile.role?.toLowerCase()}</span>
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
                  <p className="text-gray-900">{profile.email}</p>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <p className="text-gray-900">{profile.company.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <p className="text-sm text-gray-500 font-mono">{profile.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}