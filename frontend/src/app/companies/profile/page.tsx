'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Building2, Users, Briefcase, Save } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  users?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  _count?: {
    users: number;
    contacts: number;
    deals: number;
  };
}

export default function CompanyProfilePage() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      fetchCompanyProfile();
    };
    checkAuth();
    fetchCompanyProfile();
  }, [router]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await api.get('/companies/profile');
      const companyData = response.data;
      setCompany(companyData);
      setFormData({
        name: companyData.name || '',
        description: companyData.description || '',
      });
    } catch (err: any) {
      console.error('Failed to fetch company profile:', err);
      setErrors({ general: 'Failed to load company profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setSaving(true);
    setErrors({});

    try {
      const response = await api.put(`/companies/${company.id}`, formData);
      setCompany(response.data);
      setErrors({ success: 'Company profile updated successfully!' });
    } catch (err: any) {
      console.error('Failed to update company:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: err.response?.data?.message || 'Failed to update company profile' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading company profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <Link href="/companies" className="inline-flex items-center text-gray-600 hover:text-black mb-4 transition-colors duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
          <div className="flex items-center mb-2">
            <Building2 className="h-8 w-8 mr-3 text-black" />
            <h1 className="text-3xl font-bold text-black animate-slide-in-left">Company Profile</h1>
          </div>
          <p className="text-gray-600">Manage your company information and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Form */}
          <div className="lg:col-span-2">
            <Card className="hover:shadow-lg transition-all duration-300 animate-bounce-subtle">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                      {errors.general}
                    </div>
                  )}

                  {errors.success && (
                    <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl">
                      {errors.success}
                    </div>
                  )}

                  <Input
                    label="Company Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    required
                    placeholder="Enter your company name"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Company Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="flex w-full rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-base font-semibold text-black placeholder:text-gray-600 placeholder:font-medium focus:outline-none focus:ring-4 focus:ring-gray-200 focus:border-black transition-all duration-200"
                      placeholder="Tell us about your company..."
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 font-medium">{errors.description}</p>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button type="submit" isLoading={saving} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Company Stats */}
          <div className="space-y-6">
            {company && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-700">Team Members</span>
                      </div>
                      <span className="text-xl font-bold text-black">{company._count?.users || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-gray-700">Contacts</span>
                      </div>
                      <span className="text-xl font-bold text-black">{company._count?.contacts || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium text-gray-700">Active Deals</span>
                      </div>
                      <span className="text-xl font-bold text-black">{company._count?.deals || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Company ID</p>
                      <p className="font-mono text-xs text-black bg-gray-100 p-2 rounded">{company.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created</p>
                      <p className="font-semibold text-black">{new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}