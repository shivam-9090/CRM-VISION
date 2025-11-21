"use client";

import { useState, useRef, useEffect } from "react";
import Button from "./ui/Button";
import { Shield } from "lucide-react";

interface TwoFactorVerifyProps {
  onVerify: (code: string) => Promise<void>;
  error?: string;
}

export default function TwoFactorVerify({
  onVerify,
  error: propError,
}: TwoFactorVerifyProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (propError) {
      setError(propError);
    }
  }, [propError]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every((digit) => digit !== "") && index === 5) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(newCode);

    // Focus last filled input or submit if complete
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setError("");
    setLoading(true);

    try {
      await onVerify(verificationCode);
    } catch (err: any) {
      setError(err.message || "Verification failed");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join("");
    if (verificationCode.length === 6) {
      handleVerify(verificationCode);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Two-Factor Authentication
        </h3>
        <p className="text-gray-600">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              disabled={loading}
            />
          ))}
        </div>

        <Button
          type="submit"
          isLoading={loading}
          disabled={code.some((digit) => digit === "")}
          size="lg"
          className="w-full"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </Button>

        <p className="text-sm text-center text-gray-600">
          Don&apos;t have access to your authenticator app?{" "}
          <a href="/auth/support" className="text-blue-600 hover:underline">
            Contact Support
          </a>
        </p>
      </form>
    </div>
  );
}
