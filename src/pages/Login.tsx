import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import client from "../lib/client";
import { saveAuthToken, saveUser } from "../lib/auth";
import type { AxiosError } from "axios";

// Zod validation schema
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(FormValues: LoginFormData) {
    try {
      const { data } = await client.post("/api/auth/login/", FormValues);
      const token = data?.key || data?.token || data?.access;

      if (token) saveAuthToken(token);
      if (data?.user) saveUser(data.user);
      console.log(FormValues);

      toast.success("Login successful 🎉");
      nav("/dashboard");
    } catch (err: unknown) {
      let errorMsg = "Something went wrong. Please try again.";

      if ((err as AxiosError)?.isAxiosError) {
        const axiosErr = err as AxiosError<{
          detail?: string;
          non_field_errors?: string[];
        }>;
        const respData = axiosErr.response?.data;

        if (respData?.detail) {
          errorMsg = respData.detail;
        } else if (Array.isArray(respData?.non_field_errors)) {
          errorMsg = respData.non_field_errors[0];
        } else {
          errorMsg = axiosErr.message;
        }
      }

      toast.error(errorMsg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-black">
      <div className="w-full max-w-md rounded-2xl bg-[#0C111C] p-8 shadow-lg">
        <h2 className="mb-6 text-center text-3xl font-bold text-gray-200">
          Login
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username / Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Username or Email
            </label>
            <input
              type="text"
              {...register("email")}
              className="mt-1 w-full rounded-lg text-gray-200 border border-gray-400 px-3 py-2 shadow-sm focus:ring-gray-300 focus:outline-none focus:ring-2"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-200">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="mt-1 w-full rounded-lg text-gray-200 border border-gray-400 px-3 py-2 shadow-sm focus:ring-gray-300 focus:outline-none focus:ring-2"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  // Eye off icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.485.324-2.892.9-4.125M4.22 4.22l15.56 15.56M9.88 9.88A3 3 0 0114.12 14.12"
                    />
                  </svg>
                ) : (
                  // Eye icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white text-black px-4 py-2 font-semibold shadow hover:bg-white/80 disabled:opacity-60"
          >
            {isSubmitting && (
              <svg
                className="h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {isSubmitting ? "Logging in..." : "Login"}
          </button>

          {/* Forgot password */}
          <div className="text-center">
            {/* Footer Links */}
            <div className="flex flex-col items-center justify-between gap-2 pt-4 sm:flex-row sm:gap-6">
              <Link
                to="/password-reset"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
              <Link
                to="/register"
                className="text-sm text-blue-600 hover:underline"
              >
                Don’t have an account?{" "}
                <span className="font-medium">Register</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
