import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import client from "../lib/client";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Define a type for API errors
interface ApiError {
  response?: {
    data?: {
      detail?: string;
      [key: string]: unknown;
    };
  };
}

// Define Zod schema for validation
const registerSchema = z
  .object({
    firstName: z.string().min(3, "First name must be at least 3 characters"),
    lastName: z.string().min(3, "Last name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    re_password: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.re_password, {
    message: "Passwords do not match",
    path: ["re_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    try {
      await client.post("/api/auth/users/", data);
      // Show success message
      toast.success("Account created! Please check your email to verify ✅");
      navigate("/verify-email");
    } catch (err: unknown) {
      const errorData = (err as ApiError).response?.data;
      const errorMsg =
        errorData?.detail || JSON.stringify(errorData) || "Registration failed";

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-black">
      <div className="w-full max-w-md p-6 rounded-2xl shadow-lg bg-[#0C111C] text-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              First Name
            </label>
            <input
              {...register("firstName")}
              placeholder="Firstname"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Last Name
            </label>
            <input
              {...register("lastName")}
              placeholder="Lastname"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              {...register("email")}
              placeholder="Email"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="Password"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("re_password")}
              placeholder="Confirm Password"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.re_password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.re_password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center font-medium transition ${
              !isValid || isSubmitting
                ? "bg-[#3c3c3c] text-gray-400 cursor-not-allowed"
                : "bg-white text-black cursor-pointer"
            }`}
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-black"
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
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            )}
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>
        {/* Footer with login link */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
