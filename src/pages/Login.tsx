import React, { useState } from "react";
import client from "../lib/client";
import { saveAuthToken, saveUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await client.post("/api/auth/login/", form);
      const data = res.data;
      const token = data?.key || data?.token || data?.access;
      if (token) saveAuthToken(token);
      if (data?.user) saveUser(data.user);
      nav("/dashboard");
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
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded shadow">
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Username or email"
          className="w-full input"
        />
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Password"
          className="w-full input"
        />
        <div className="flex justify-between items-center">
          <button className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <a href="/password-reset" className="text-sm">
            Forgot?
          </a>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
    </div>
  );
}
