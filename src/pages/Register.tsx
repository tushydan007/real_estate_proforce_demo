import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import client from "../lib/client";
import { saveAuthToken, saveUser } from "../lib/auth";
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
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password1: z.string().min(6, "Password must be at least 6 characters"),
    password2: z.string().min(6, "Password confirmation is required"),
  })
  .refine((data) => data.password1 === data.password2, {
    message: "Passwords do not match",
    path: ["password2"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    try {
      const res = await client.post("/api/auth/registration/", data);
      const result = res.data;

      const token = result?.key || result?.token || result?.access;
      if (token) saveAuthToken(token);
      if (result?.user) saveUser(result.user);

      toast.success("Account created successfully 🎉");
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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div>
            <input
              {...register("username")}
              placeholder="Username"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.username && (
              <p className="text-sm text-red-600 mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
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
            <input
              type="password"
              {...register("password1")}
              placeholder="Password"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.password1 && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password1.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <input
              type="password"
              {...register("password2")}
              placeholder="Confirm Password"
              className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-indigo-300"
            />
            {errors.password2 && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password2.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-black/80 text-white font-medium py-2 px-4 rounded-lg flex justify-center items-center cursor-pointer"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
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
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        {/* Footer with login link */}
        <div className="mt-6 text-center text-sm text-gray-600">
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
