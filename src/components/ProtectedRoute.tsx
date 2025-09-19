import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { getAuthToken } from "../lib/auth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getAuthToken();
  const user = useSelector((state: RootState) => state.auth.user);
  const location = useLocation();

  // Basic guard: token and user present
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
