import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Subscription from "./pages/Subscription";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MapPage from "./pages/MapPage";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./components/AboutUs";
import UserAoi from "./pages/UserAoi";

const App = () => {
  return (
    <div className="min-h-screen flex flex-col w-full max-w-full overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/password-reset" element={<ForgotPassword />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
            path="/map-page"
            element={
              // <ProtectedRoute>
              <MapPage />
              // </ProtectedRoute>
            }
          />
          <Route path="/subscription" element={<Subscription />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
