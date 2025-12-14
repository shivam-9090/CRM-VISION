"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "expired"
  >("verifying");

  // Verify email mutation
  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/verify-email/${verificationToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Failed to verify email. Token may have expired."
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      setStatus("success");
      toast.success("Email verified successfully!");
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    },
    onError: (error: Error) => {
      setStatus("error");
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    // Verify email immediately
    verifyMutation.mutate(token);
  }, [token, verifyMutation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-white">Email Verification</h1>
          <p className="mt-2 text-blue-100">Verify your email address</p>
        </div>

        <div className="px-6 py-8">
          {status === "verifying" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Loader className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verifying Your Email...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Email Verified! ✓
              </h2>
              <p className="text-gray-600">
                Your email has been successfully verified. You can now log in to
                your account.
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to login in 2 seconds...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verification Failed
              </h2>
              <p className="text-gray-600">
                {!token
                  ? "No verification token found. Please check your email for the verification link."
                  : "The verification link is invalid or has expired. Please request a new one from your manager."}
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => router.push("/auth/login")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Login
                </Button>
                <Button onClick={() => router.push("/")} className="w-full">
                  Go to Home
                </Button>
              </div>
            </div>
          )}

          {status === "expired" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-16 w-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Link Expired</h2>
              <p className="text-gray-600">
                Your verification link has expired (valid for 24 hours). Please
                request a new verification email from your manager.
              </p>
              <div className="mt-6 space-y-3">
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500">
          <p>Questions? Contact your administrator</p>
        </div>
      </div>
    </div>
  );
}
