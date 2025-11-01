"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Shield, Copy, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
}

export default function TwoFactorSetup({ onSetupComplete }: TwoFactorSetupProps) {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post("/api/auth/2fa/enable");
      
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setSuccess(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate 2FA setup");
      console.error("2FA enable error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post("/api/auth/2fa/verify", {
        token: verificationToken,
      });
      
      setSuccess(response.data.message || "2FA enabled successfully!");
      setQrCode(null);
      setSecret(null);
      setVerificationToken("");
      
      // Notify parent component
      if (onSetupComplete) {
        setTimeout(() => {
          onSetupComplete();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code");
      console.error("2FA verify error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!qrCode && !success && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enable two-factor authentication using an authenticator app like Google Authenticator,
              Authy, or Microsoft Authenticator.
            </p>
            <Button onClick={handleEnable2FA} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Enable 2FA"}
            </Button>
          </div>
        )}

        {qrCode && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600">
                Open your authenticator app and scan this QR code:
              </p>
              <div className="flex justify-center bg-white p-4 rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Step 2: Or Enter Secret Manually</h3>
              <p className="text-sm text-gray-600">
                If you can&apos;t scan the QR code, enter this secret key manually:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={secret || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySecret}
                  title="Copy secret"
                  className="px-3"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Step 3: Verify</h3>
              <p className="text-sm text-gray-600">
                Enter the 6-digit code from your authenticator app:
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationToken}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setVerificationToken(value);
                    }}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>
                <Button
                  onClick={handleVerify2FA}
                  disabled={loading || verificationToken.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify and Enable 2FA"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
