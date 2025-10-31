'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

export default function CreateContactPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
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

    // Client-side validation
    if (!formData.firstName.trim()) {
      setErrors({ firstName: 'First name is required' });
      setLoading(false);
      return;
    }

    if (formData.firstName.trim().length < 2) {
      setErrors({ firstName: 'First name must be at least 2 characters long' });
      setLoading(false);
      return;
    }

    if (!formData.lastName.trim()) {
      setErrors({ lastName: 'Last name is required' });
      setLoading(false);
      return;
    }

    if (formData.lastName.trim().length < 2) {
      setErrors({ lastName: 'Last name must be at least 2 characters long' });
      setLoading(false);
      return;
    }

    if (formData.email && (!formData.email.includes('@') || !formData.email.includes('.'))) {
      setErrors({ email: 'Please enter a valid email address' });
      setLoading(false);
      return;
    }

    if (formData.phone && formData.phone.length < 10) {
      setErrors({ phone: 'Phone number must be at least 10 characters long' });
      setLoading(false);
      return;
    }

    try {
      // Clean the data before sending
      const cleanFormData = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim().toLowerCase() || '',
        phone: formData.phone?.trim() || '',
        companyId: formData.companyId || ''
      };
      
      await api.post('/contacts', cleanFormData);
      router.push('/contacts');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        if (response?.data?.errors) {
          setErrors(response.data.errors);
        } else {
          setErrors({ general: response?.data?.message || 'Failed to create contact' });
        }
      } else {
        setErrors({ general: 'Failed to create contact' });
      }
    } finally {
      setLoading(false);
    }
  };

  const companyOptions = [
    { value: '', label: 'Select a company' },
    ...companies.map(company => ({ value: company.id, label: company.name }))
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-8 bg-gray-50 min-h-screen animate-fade-in">
        <div className="mb-8">
          <Link href="/contacts" className="inline-flex items-center text-gray-600 hover:text-black mb-4 transition-colors duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Link>
          <h1 className="text-3xl font-bold text-black animate-slide-in-left">Create Contact</h1>
        </div>

        <Card className="max-w-xl mx-auto hover:shadow-lg transition-all duration-300 animate-bounce-subtle">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name *"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={errors.lastName}
                  required
                />
              </div>

              <Select
                label="Company *"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                options={companyOptions}
                error={errors.companyId}
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />

              <div className="flex gap-4">
                <Button type="submit" isLoading={loading}>
                  Create Contact
                </Button>
                <Link href="/contacts">
                  <Button variant="secondary" type="button">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}