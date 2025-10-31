'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasAuthToken, verifyAuthToken } from '@/lib/auth-utils';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Settings, Edit, Trash2, Building2, Users, Briefcase, Calendar, Search } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  _count?: {
    users: number;
    contacts: number;
    deals: number;
  };
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchCompanies();
    };
    checkAuth();
  }, [router]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Failed to fetch companies');
      } else {
        setError('Failed to fetch companies');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      await api.delete(`/companies/${id}`);
      setCompanies(companies.filter(company => company.id !== id));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        setError(response?.data?.message || 'Failed to delete company');
      } else {
        setError('Failed to delete company');
      }
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading companies...</p>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="animate-fade-in">
              <h1 className="text-4xl font-bold text-black mb-2 flex items-center">
                <Building2 className="h-10 w-10 mr-3 text-black" />
                Companies
              </h1>
              <p className="text-lg text-gray-600">Manage your company relationships and data</p>
            </div>
            <Link href="/companies/profile">
              <Button size="lg" className="shadow-lg hover-lift">
                <Settings className="h-5 w-5 mr-2" />
                Company Settings
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-black focus:ring-4 focus:ring-gray-200 transition-all duration-200 text-base font-semibold text-black placeholder:text-gray-600 placeholder:font-medium"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-600">
                <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Companies</p>
                  <p className="text-3xl font-bold text-black">{companies.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Contacts</p>
                  <p className="text-3xl font-bold text-black">
                    {companies.reduce((sum, c) => sum + (c._count?.contacts || 0), 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Deals</p>
                  <p className="text-3xl font-bold text-black">
                    {companies.reduce((sum, c) => sum + (c._count?.deals || 0), 0)}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-black" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Building2 className="h-6 w-6 mr-2 text-blue-600" />
              All Companies ({filteredCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-600 mb-2">
                  {companies.length === 0 ? 'Company information not found' : 'No companies match your search'}
                </p>
                <p className="text-gray-500 mb-6">
                  {companies.length === 0 
                    ? 'Set up your company profile to get started' 
                    : 'Try adjusting your search terms'
                  }
                </p>
                {companies.length === 0 && (
                  <Link href="/companies/profile">
                    <Button size="lg">Set up company profile</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-gray-100">
                      <TableHead className="font-semibold text-gray-700">Company</TableHead>
                      <TableHead className="font-semibold text-gray-700">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Users</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Contacts</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Deals</TableHead>
                      <TableHead className="font-semibold text-gray-700">Created</TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{company.name}</p>
                              <p className="text-sm text-gray-500">{company.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-700 max-w-xs truncate">
                            {company.description || <span className="text-gray-400 italic">No description</span>}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {company._count?.users || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {company._count?.contacts || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {company._count?.deals || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {new Date(company.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Link href={`/companies/${company.id}/edit`}>
                              <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(company.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}