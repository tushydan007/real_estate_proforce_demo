import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
// import Subscription from "./pages/Subscription";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MapPage from "./pages/MapPage";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./components/AboutUs";
import UserAoi from "./pages/UserAoi";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckOutPage";
import PaymentSuccessPage from "./pages/payments/PaymentSuccessPage";
import PaymentFailedPage from "./pages/payments/PaymentFailedPage";
import MapHighlightPage from "./pages/MapHighlightPage";
import type { AppDispatch } from "./redux/store";
import Careers from "./pages/CareersPage";
import LoadingSpinner from "./components/LoadingSpinner";
import { initializeAuth, validateToken } from "./redux/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

const App = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useAuth();

  useEffect(() => {
    // Initialize auth state from localStorage on app start
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    // Periodically validate token
    const interval = setInterval(() => {
      dispatch(validateToken());
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [dispatch]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/password-reset" element={<ForgotPassword />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/map-page" element={<MapPage />} />
          <Route path="/map" element={<MapHighlightPage />} />
          <Route path="/login" element={<Login />} />
          {/* <Route path="/subscription" element={<Subscription />} /> */}
          <Route path="/careers" element={<Careers />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-failed"
            element={
              <ProtectedRoute>
                <PaymentFailedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-aoi"
            element={
              <ProtectedRoute>
                <UserAoi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage orderId="123456" />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
