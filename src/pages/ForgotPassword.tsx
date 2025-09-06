"use client";

import React, { useState } from "react";
import client from "../lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import axios, { AxiosError } from "axios";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post("/api/auth/password/reset/", { email });
      setSuccess(true);
      toast.success("Password reset email sent! 📩");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<{ detail?: string }>;
        toast.error(
          serverError.response?.data?.detail ||
            "Failed to send reset email. Try again."
        );
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 bg-black">
      <Card className="w-full max-w-md shadow-lg bg-[#0C111C] border-none">
        {!success ? (
          <>
            {/* Reset Form */}
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-gray-200">
                Reset Your Password
              </CardTitle>
              <p className="text-center text-sm text-gray-400 mt-1">
                Enter your email address and we’ll send you a link to reset your
                password.
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={submit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="mb-2">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="text-gray-200 border border-gray-400 shadow-md focus:ring-gray-300 focus:outline-none focus:ring-2"
                  />
                </div>

                <Button type="submit" className="w-full cursor-pointer bg-white text-black hover:bg-white/80" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Email"}
                </Button>

                {/* Auth links */}
                <div className="pt-4 flex justify-between gap-12">
                  <Button variant="link" className="text-blue-600" asChild>
                    <a href="/login">Back to Login</a>
                  </Button>
                  <Button variant="link" className="text-blue-600" asChild>
                    <a href="/register">Sign Up</a>
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            {/* Success Screen */}
            <CardContent className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-center">
                Check your email 📩
              </h3>
              <p className="text-center text-gray-600 mt-2 mb-6">
                We’ve sent a password reset link to <strong>{email}</strong>.
                Follow the instructions to reset your password.
              </p>

              <div className="flex justify-center gap-8">
                <Button asChild>
                  <a href="/login">Back to Login</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/register">Sign Up</a>
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
