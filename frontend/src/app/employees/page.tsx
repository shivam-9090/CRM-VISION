'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth-utils';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserPlus, Edit, Trash2, Mail, Phone, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  isVerified: boolean;
  plainPassword?: string; // Password visible to manager
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [adding, setAdding] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Check if user is MANAGER or ADMIN
  useEffect(() => {
    const user = getStoredUser();
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      toast.error('Access denied. Only managers can access this page.');
      router.push('/dashboard');
      return;
    }
    fetchEmployees();
  }, [router]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/employees/list');
      setEmployees(response.data.employees || []);
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployeeEmail.trim() || !newEmployeeEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setAdding(true);
      const payload: any = {
        email: newEmployeeEmail.toLowerCase(),
        role: 'EMPLOYEE',
      };

      // Add custom password if provided
      if (customPassword.trim()) {
        if (customPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          setAdding(false);
          return;
        }
        payload.customPassword = customPassword;
      }

      const response = await api.post('/users/employees', payload);

      toast.success('Employee added successfully!');
      setTempPassword(response.data.temporaryPassword);
      setNewEmployeeEmail('');
      setCustomPassword('');
      fetchEmployees();
    } catch (error: any) {
      console.error('Error adding employee:', error);
      const message = error.response?.data?.message || 'Failed to add employee';
      toast.error(message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await api.delete(`/users/employees/${id}`);
      toast.success('Employee removed successfully');
      setDeleteConfirm(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      const message = error.response?.data?.message || 'Failed to remove employee';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-2">
              Manage your team members and their access
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <UserPlus className="h-5 w-5 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Employee Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{employees.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {employees.filter(e => e.isVerified).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verification</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">
                {employees.filter(e => !e.isVerified).length}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Employee List */}
      <div className="max-w-7xl mx-auto">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">No employees yet</p>
                      <p className="text-sm mt-1">Add your first team member to get started</p>
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {employee.email}
                          </div>
                          {employee.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {employee.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {employee.plainPassword ? (
                            <>
                              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-800 select-all">
                                {employee.plainPassword}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(employee.plainPassword!);
                                  toast.success('Password copied!');
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Copy password"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Password changed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {employee.isVerified ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.lastLoginAt
                          ? new Date(employee.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setDeleteConfirm(employee.id)}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Employee Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Employee</h3>
            
            {tempPassword ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    Employee added successfully!
                  </p>
                  <p className="text-sm text-green-700 mb-3">
                    Share this temporary password with the employee:
                  </p>
                  <div className="bg-white border border-green-300 rounded p-3 font-mono text-sm">
                    {tempPassword}
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    The employee will be able to login with their email and this password.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      toast.success('Password copied to clipboard!');
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Copy Password
                  </Button>
                  <Button
                    onClick={() => {
                      setTempPassword('');
                      setAddModalOpen(false);
                    }}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Email *
                  </label>
                  <input
                    type="email"
                    value={newEmployeeEmail}
                    onChange={(e) => setNewEmployeeEmail(e.target.value)}
                    placeholder="employee@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Password (Optional)
                  </label>
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Leave empty for auto-generated password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {customPassword.trim() 
                      ? 'Employee will use this custom password to login'
                      : 'A temporary password will be generated automatically'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setAddModalOpen(false);
                      setNewEmployeeEmail('');
                      setCustomPassword('');
                    }}
                    variant="secondary"
                    className="flex-1"
                    disabled={adding}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEmployee}
                    disabled={adding || !newEmployeeEmail.trim()}
                    className="flex-1"
                  >
                    {adding ? 'Adding...' : 'Add Employee'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Remove Employee?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this employee? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setDeleteConfirm(null)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteEmployee(deleteConfirm)}
                variant="danger"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
