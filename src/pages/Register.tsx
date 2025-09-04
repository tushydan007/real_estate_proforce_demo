import React, { useState } from "react";
import client from "../lib/client";
import { saveAuthToken, saveUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await client.post("/api/auth/registration/", form);
      // response may contain token or require email verification: adapt below
      const data = res.data;
      // If backend returns a token (e.g., { key: "..." } or { access: "..." })
      const token = data?.key || data?.token || data?.access;
      if (token) {
        saveAuthToken(token);
      }
      // Save user if provided
      if (data?.user) saveUser(data.user);
      // Navigate to verify-email or dashboard depending on your flow
      navigate("/verify-email");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          JSON.stringify(err?.response?.data) ||
          String(err)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create account</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username"
          className="w-full input"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          className="w-full input"
        />
        <input
          type="password"
          value={form.password1}
          onChange={(e) => setForm({ ...form, password1: e.target.value })}
          placeholder="Password"
          className="w-full input"
        />
        <input
          type="password"
          value={form.password2}
          onChange={(e) => setForm({ ...form, password2: e.target.value })}
          placeholder="Confirm password"
          className="w-full input"
        />
        <div className="flex justify-between items-center">
          <button disabled={loading} className="btn-primary">
            {loading ? "Creating..." : "Create account"}
          </button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
    </div>
  );
}
