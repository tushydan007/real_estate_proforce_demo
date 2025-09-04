import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import client from "../lib/client"; // axios instance
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await client.post("/api/auth/registration/resend-email/", {});
      toast.success("Verification email resent 📧");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Failed to resend verification email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Verify Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-gray-600">
            We’ve sent a verification link to your email address. Please check
            your inbox and click the link to activate your account.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Resending..." : "Resend Email"}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = "/login";
              }}
            >
              Go to Login
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Didn’t receive the email? Check your spam folder or try resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
