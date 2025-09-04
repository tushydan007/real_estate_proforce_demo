import React from "react";
import { Navigate } from "react-router-dom";
import { getAuthToken, getUser } from "../lib/auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getAuthToken();
  const user = getUser();

  // Basic guard: token present. You can improve by calling /api/subscriptions/ check.
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
