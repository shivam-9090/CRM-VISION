"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Sidebar from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  User,
  Shield,
  ArrowRight,
  Camera,
  Mail,
  Phone,
  Calendar,
  Lock,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

const COUNTRY_CODES = [
  { value: "+1", label: "🇺🇸 +1 (US/Canada)" },
  { value: "+44", label: "🇬🇧 +44 (UK)" },
  { value: "+91", label: "🇮🇳 +91 (India)" },
  { value: "+61", label: "🇦🇺 +61 (Australia)" },
  { value: "+86", label: "🇨🇳 +86 (China)" },
  { value: "+81", label: "🇯🇵 +81 (Japan)" },
  { value: "+82", label: "🇰🇷 +82 (South Korea)" },
  { value: "+33", label: "🇫🇷 +33 (France)" },
  { value: "+49", label: "🇩🇪 +49 (Germany)" },
  { value: "+39", label: "🇮🇹 +39 (Italy)" },
  { value: "+34", label: "🇪🇸 +34 (Spain)" },
  { value: "+7", label: "🇷🇺 +7 (Russia)" },
  { value: "+55", label: "🇧🇷 +55 (Brazil)" },
  { value: "+52", label: "🇲🇽 +52 (Mexico)" },
  { value: "+27", label: "🇿🇦 +27 (South Africa)" },
  { value: "+971", label: "🇦🇪 +971 (UAE)" },
  { value: "+65", label: "🇸🇬 +65 (Singapore)" },
];

const USER_ROLES = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    countryCode: "+1",
    companyName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      setProfile(response.data);

      // Parse phone number to extract country code
      let countryCode = "+1";
      let phoneNumber = response.data.phone || "";

      if (phoneNumber) {
        // Try to match country code from the phone number
        const matchedCode = COUNTRY_CODES.find((cc) =>
          phoneNumber.startsWith(cc.value)
        );
        if (matchedCode) {
          countryCode = matchedCode.value;
          phoneNumber = phoneNumber.substring(matchedCode.value.length).trim();
        }
      }

      setFormData({
        name: response.data.name || "",
        phone: phoneNumber,
        countryCode: countryCode,
        companyName: response.data.company?.name || "",
      });
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast.error("Failed to load profile");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Combine country code with phone number
      const phoneWithCountryCode = formData.phone
        ? `${formData.countryCode} ${formData.phone}`
        : "";

      const response = await api.patch(`/users/${profile?.id}`, {
        name: formData.name,
        phone: phoneWithCountryCode,
      });
      setProfile(response.data);
      setIsEditing(false);
      toast.success("Profile updated successfully");
      fetchProfile(); // Refresh profile data
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as {
            response?: {
              data?: { errors?: Record<string, string>; message?: string };
            };
          }
        ).response;
        if (response?.data?.errors) {
          setErrors(response.data.errors);
        } else {
          setErrors({
            general: response?.data?.message || "Failed to update profile",
          });
        }
      } else {
        setErrors({ general: "Failed to update profile" });
      }
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Re-parse phone number when canceling
    let countryCode = "+1";
    let phoneNumber = profile?.phone || "";

    if (phoneNumber) {
      const matchedCode = COUNTRY_CODES.find((cc) =>
        phoneNumber.startsWith(cc.value)
      );
      if (matchedCode) {
        countryCode = matchedCode.value;
        phoneNumber = phoneNumber.substring(matchedCode.value.length).trim();
      }
    }

    setFormData({
      name: profile?.name || "",
      phone: phoneNumber,
      countryCode: countryCode,
      companyName: profile?.company?.name || "",
    });
    setIsEditing(false);
    setErrors({});
  };

  const handleEnable2FA = async () => {
    setTwoFactorLoading(true);
    try {
      const response = await api.post("/auth/2fa/enable");
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setShowTwoFactorSetup(true);
      toast.success(
        response.data.message || "Scan the QR code with your authenticator app"
      );
    } catch (err: any) {
      console.error("Failed to initiate 2FA:", err);
      toast.error(err.response?.data?.message || "Failed to generate QR code");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Secret copied to clipboard!");
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setTwoFactorLoading(true);
    try {
      await api.post("/auth/2fa/verify", { token: verificationCode });
      toast.success("Two-Factor Authentication enabled successfully!");
      setShowTwoFactorSetup(false);
      setVerificationCode("");
      fetchProfile(); // Refresh profile to show updated 2FA status
    } catch (err: any) {
      console.error("Failed to verify 2FA:", err);
      toast.error(
        err.response?.data?.message || "Invalid or expired verification code"
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt(
      "Please enter your password to disable Two-Factor Authentication:"
    );

    if (!password) {
      return; // User cancelled
    }

    setTwoFactorLoading(true);
    try {
      await api.post("/auth/2fa/disable", { password });
      toast.success("Two-Factor Authentication disabled");
      fetchProfile(); // Refresh profile
    } catch (err: any) {
      console.error("Failed to disable 2FA:", err);
      toast.error(
        err.response?.data?.message ||
          "Failed to disable 2FA. Please check your password."
      );
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleCancel2FASetup = () => {
    setShowTwoFactorSetup(false);
    setVerificationCode("");
    setQrCode(null);
    setSecret(null);
  };

  const handleUpdateCompany = async () => {
    if (!profile?.company?.id) {
      toast.error("Company information not available");
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Use the companies endpoint with plural form
      const response = await api.patch(`/companies/${profile.company.id}`, {
        name: formData.companyName,
      });
      toast.success("Company name updated successfully");
      setIsEditingCompany(false);
      fetchProfile(); // Refresh profile data
    } catch (err: unknown) {
      console.error("Company update error:", err);

      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as {
            response?: {
              status?: number;
              data?: { errors?: Record<string, string>; message?: string };
            };
          }
        ).response;

        const errorMessage =
          response?.data?.message || "Failed to update company";

        if (response?.status === 403) {
          toast.error(
            "You don't have permission to update company information"
          );
          setErrors({
            general:
              "Permission denied. Only managers and admins can update company details.",
          });
        } else if (response?.status === 404) {
          toast.error("Cannot update company. The route may not be enabled.");
          setErrors({
            general:
              "Company update is currently not available. Please contact support.",
          });
          setIsEditingCompany(false);
        } else if (response?.data?.errors) {
          setErrors(response.data.errors);
          toast.error(errorMessage);
        } else {
          setErrors({ general: errorMessage });
          toast.error(errorMessage);
        }
      } else {
        setErrors({ general: "Failed to update company" });
        toast.error("Failed to update company");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelCompany = () => {
    setFormData({
      ...formData,
      companyName: profile?.company?.name || "",
    });
    setIsEditingCompany(false);
    setErrors({});
  };

  if (!profile) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-4 bg-gray-50 min-h-screen animate-fade-in">
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
      <div className="flex-1 p-4 bg-gray-50 min-h-screen animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black flex items-center animate-slide-in-left">
            <User className="h-8 w-8 mr-3" />
            User Profile
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account information and settings
          </p>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <Select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleChange}
                        options={COUNTRY_CODES}
                        className="w-40"
                      />
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        placeholder="555-0000"
                        className="flex-1"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" isLoading={loading}>
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900 font-medium">
                      {profile?.name || "Not set"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-gray-900">
                        {profile?.phone || "Not set"}
                      </span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">{profile?.email}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <div>
                    <p className="text-gray-900 font-medium">
                      {profile?.company?.name || "Not set"}
                    </p>
                    {profile?.company?.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {profile.company.description}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Two-Factor Authentication
                  </label>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-gray-500" />
                    <span
                      className={`font-medium ${
                        profile?.twoFactorEnabled
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {profile?.twoFactorEnabled ? "Active" : "Inactive"}
                    </span>
                    {profile?.twoFactorEnabled && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        ✓ Protected
                      </span>
                    )}
                  </div>
                  {!profile?.twoFactorEnabled && (
                    <p className="text-sm text-gray-500 mt-1">
                      Enable 2FA in Security Settings for better protection
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-gray-900">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {profile?.lastLoginAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Login
                    </label>
                    <p className="text-sm text-gray-600">
                      {new Date(profile.lastLoginAt).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}

                {/* Two-Factor Authentication - Only show for MANAGER and ADMIN */}
                {(profile?.role === "MANAGER" || profile?.role === "ADMIN") && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Two-Factor Authentication
                    </label>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            profile?.twoFactorEnabled
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-gray-900 text-sm">
                          {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      {!showTwoFactorSetup && (
                        <Button
                          onClick={
                            profile?.twoFactorEnabled
                              ? handleDisable2FA
                              : handleEnable2FA
                          }
                          isLoading={twoFactorLoading}
                          variant="outline"
                          className={`text-xs h-8 ${
                            profile?.twoFactorEnabled
                              ? "border-red-300 text-red-600 hover:bg-red-50"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {profile?.twoFactorEnabled ? "Disable" : "Enable 2FA"}
                        </Button>
                      )}
                    </div>

                    {/* 2FA Setup/Verification Form */}
                    {showTwoFactorSetup && qrCode && secret && (
                      <div className="space-y-4 mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <Smartphone className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2">
                                📱 Authenticator App Setup
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Scan this QR code with your authenticator app
                                (Google Authenticator, Authy, Microsoft
                                Authenticator, etc.)
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* QR Code Display */}
                        <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                          <Image
                            src={qrCode}
                            alt="2FA QR Code"
                            width={200}
                            height={200}
                            className="rounded-lg"
                          />
                        </div>

                        {/* Manual Secret Key */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900">
                            Or enter this code manually:
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-gray-100 rounded border text-sm font-mono break-all">
                              {secret}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopySecret}
                              className="shrink-0"
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <form onSubmit={handleVerify2FA} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Enter 6-digit code from app
                            </label>
                            <Input
                              type="text"
                              value={verificationCode}
                              onChange={(e) =>
                                setVerificationCode(
                                  e.target.value.replace(/\D/g, "").slice(0, 6)
                                )
                              }
                              placeholder="000000"
                              required
                              maxLength={6}
                              className="text-center text-2xl tracking-widest font-mono"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCancel2FASetup}
                              className="flex-1 h-9 text-sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              isLoading={twoFactorLoading}
                              className="flex-1 h-9 text-sm"
                            >
                              Verify & Enable
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
