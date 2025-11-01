"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Shield, Lock, Check, AlertCircle } from "lucide-react";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { useAuth } from "@/lib/auth-provider";
import api from "@/lib/api";

export default function SecurityPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  const is2FAEnabled = user?.twoFactorEnabled || false;

  const handleDisable2FA = async () => {
    if (!password) {
      setError("Please enter your password to disable 2FA");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post("/api/auth/2fa/disable", { password });
      
      setSuccess(response.data.message || "2FA disabled successfully");
      setPassword("");
      setShowDisable2FA(false);
      
      // Refresh user data
      await refreshUser();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to disable 2FA");
      console.error("2FA disable error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handle2FASetupComplete = async () => {
    // Refresh user data to reflect 2FA enabled status
    await refreshUser();
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Lock className="h-8 w-8" />
          Security Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800 mb-6">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* 2FA Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <CardTitle>Two-Factor Authentication</CardTitle>
              </div>
              {is2FAEnabled && (
                <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                  Enabled
                </span>
              )}
            </div>
            <CardDescription>
              {is2FAEnabled
                ? "Your account is protected with two-factor authentication"
                : "Add an extra layer of security to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {is2FAEnabled ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Two-factor authentication is currently enabled on your account. You&apos;ll be asked for a
                  verification code each time you log in.
                </p>
                {!showDisable2FA ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDisable2FA(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Disable 2FA
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50">
                    <p className="text-sm font-semibold text-red-800">
                      Enter your password to disable 2FA
                    </p>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDisable2FA}
                        disabled={loading || !password}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {loading ? "Disabling..." : "Confirm Disable"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDisable2FA(false);
                          setPassword("");
                          setError(null);
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Two-factor authentication is not enabled. Enable it now to secure your account with an
                  authenticator app.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2FA Setup Card (only show if not enabled) */}
        {!is2FAEnabled && <TwoFactorSetup onSetupComplete={handle2FASetupComplete} />}

        {/* Account Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Use a strong, unique password for your account</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Enable two-factor authentication for extra security</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Keep your authenticator app backed up and secure</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Never share your verification codes with anyone</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
