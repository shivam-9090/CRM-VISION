"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasAuthToken, storeAuthData } from "@/lib/auth-utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LogIn, Building2, Sparkles, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import TwoFactorVerify from "@/components/TwoFactorVerify";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");

  // Check if already authenticated
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLoggedIn = hasAuthToken();

      if (isLoggedIn) {
        // User already logged in, redirect to dashboard
        router.replace("/dashboard");
      } else {
        // User not logged in, show login form
        setCheckingAuth(false);
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Client-side validation
    if (!email.trim()) {
      setError("Email address is required");
      setLoading(false);
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      // Make login API call - the backend will set httpOnly cookie
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      // Check if 2FA is required
      if (response.data.requiresTwoFactor) {
        setRequires2FA(true);
        setLoading(false);
        setError("");
        return;
      }

      console.log("📦 Login response data:", response.data);

      // Store user data in localStorage for quick access (token is in httpOnly cookie)
      if (!response.data.user || !response.data.token) {
        console.error("❌ Missing user or token in response", {
          hasUser: !!response.data.user,
          hasToken: !!response.data.token,
          responseData: response.data,
        });
        setError(
          "Login successful but authentication data is incomplete. Please try again."
        );
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);

      console.log("🔑 Login successful!", response.data);

      // Wait for localStorage to persist
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify storage before redirecting
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        console.error("❌ Failed to persist auth data to localStorage");
        setError(
          "Login successful but session initialization failed. Please try again."
        );
        setLoading(false);
        return;
      }

      console.log("🔑 Redirecting to dashboard...");

      // Force a hard navigation to ensure fresh auth check
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      console.error("Login error:", err);
      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as {
            response?: {
              data?: {
                message?: string | string[];
                error?: { message?: string | string[] };
              };
            };
          }
        ).response;

        // Handle different error response formats from backend
        const errorMessage =
          response?.data?.error?.message || response?.data?.message;

        if (errorMessage && Array.isArray(errorMessage)) {
          // Backend validation errors (array of messages)
          setError(errorMessage.join(", "));
        } else if (errorMessage && typeof errorMessage === "string") {
          // Single error message
          setError(errorMessage);
        } else {
          setError(
            "Login failed. Please check your credentials and try again."
          );
        }
      } else {
        setError("Login failed. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (code: string) => {
    setTwoFactorError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        twoFactorToken: code,
      });

      console.log("📦 2FA Login response data:", response.data);

      // Store user data in localStorage
      if (!response.data.user || !response.data.token) {
        throw new Error("Authentication data incomplete");
      }

      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);

      await new Promise((resolve) => setTimeout(resolve, 200));

      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ 2FA verification error:", err);
      const errorMessage =
        err?.response?.data?.message || "Invalid verification code";
      setTwoFactorError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-700 group-hover:text-blue-600 transition-colors" />
        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
          Back to Home
        </span>
      </Link>

      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CRM VISION</h1>
                <p className="text-blue-100 text-sm">
                  Customer Relationship Management
                </p>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Welcome back to your CRM
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              Manage your customers, deals, and business relationships with our
              powerful CRM platform.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-blue-100">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>Advanced customer relationship management</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>Real-time analytics and reporting</span>
            </div>
            <div className="flex items-center text-blue-100">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>Streamlined sales pipeline management</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 h-32 w-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 h-48 w-48 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center mb-8 lg:hidden">
            <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mr-3">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CRM VISION</h1>
              <p className="text-gray-600 text-sm">
                Customer Relationship Management
              </p>
            </div>
          </div>

          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center">
                <LogIn className="h-8 w-8 mr-3 text-blue-600" />
                Sign In
              </CardTitle>
              <p className="text-gray-700 mt-2 font-medium">
                Welcome back! Please sign in to your account.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {requires2FA ? (
                <TwoFactorVerify
                  onVerify={handleTwoFactorVerify}
                  error={twoFactorError}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center">
                      <div className="h-2 w-2 bg-red-500 rounded-full mr-3"></div>
                      {error}
                    </div>
                  )}

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />

                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter your password (min 6 characters)"
                  />

                  <Button
                    type="submit"
                    isLoading={loading}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-700 font-medium">
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/auth/register"
                        className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Create one here
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
