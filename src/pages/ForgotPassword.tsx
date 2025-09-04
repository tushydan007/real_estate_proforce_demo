import React, { useState } from "react";
import client from "../lib/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    try {
      const res = await client.post("/api/auth/password/reset/", { email });
      setMsg("Password reset email sent if that email exists.");
    } catch (e: any) {
      setErr(String(e?.response?.data || e.message));
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded shadow">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full input"
        />
        <button className="btn-primary">Send reset email</button>
        {msg && <div className="text-green-600">{msg}</div>}
        {err && <div className="text-red-600">{err}</div>}
      </form>
    </div>
  );
}
