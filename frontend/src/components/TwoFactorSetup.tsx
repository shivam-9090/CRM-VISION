"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Shield, Smartphone, Check, AlertCircle, Copy } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
}

export default function TwoFactorSetup({
  onSetupComplete,
}: TwoFactorSetupProps) {
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

      const response = await api.post("/auth/2fa/enable");

      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setSuccess(
        response.data.message || "Scan the QR code with your authenticator app"
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to generate QR code");
      console.error("2FA enable error:", err);
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

  const handleVerify2FA = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post("/auth/2fa/verify", {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security with an authenticator app
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

        {!qrCode && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Authenticator App Protection
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Use apps like Google Authenticator, Authy, or Microsoft
                  Authenticator to generate time-based verification codes for
                  enhanced security.
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnable2FA}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generating QR Code..." : "Enable 2FA"}
            </Button>
          </div>
        )}

        {qrCode && secret && (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900">
                Step 1: Scan QR Code
              </p>
              <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                <Image
                  src={qrCode}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Or enter this code manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded border text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button
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
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">
                Step 2: Enter Verification Code
              </p>
              <p className="text-xs text-gray-600">
                Enter the 6-digit code from your authenticator app
              </p>
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
        )}
      </CardContent>
    </Card>
  );
}
