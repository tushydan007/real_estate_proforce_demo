// import { Routes, Route, useLocation } from "react-router-dom";
// import Home from "./pages/Home";
// import Register from "./pages/Register";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import Subscription from "./pages/Subscription";
// import VerifyEmail from "./pages/VerifyEmail";
// import ForgotPassword from "./pages/ForgotPassword";
// import ProtectedRoute from "./components/ProtectedRoute";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import MapPage from "./pages/MapPage";

// const App = () => {
//   const location = useLocation();

//   // Define routes where Navbar and Footer should be hidden
//   const authRoutes = ["/login", "/register", "/password-reset"];
//   const isAuthPage = authRoutes.includes(location.pathname);

//   return (
//     <div className="min-h-screen bg-slate-50 flex flex-col flex-1 w-screen">
//       {!isAuthPage && <Navbar />}
//       <main className="flex-1">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/verify-email" element={<VerifyEmail />} />
//           <Route path="/password-reset" element={<ForgotPassword />} />
//           <Route path="/map-page" element={<MapPage />} />
//           <Route
//             path="/dashboard"
//             element={
//               <ProtectedRoute>
//                 <Dashboard />
//               </ProtectedRoute>
//             }
//           />
//           <Route
//             path="/subscription"
//             element={
//               // <ProtectedRoute>
//               <Subscription />
//               // </ProtectedRoute>
//             }
//           />
//         </Routes>
//       </main>
//       {!isAuthPage && <Footer />}
//     </div>
//   );
// };

// export default App;

// import RealEstateAppWrapper from "./components/RealEstateAppWrapper";

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
import FeaturesPage from "./pages/Features";

const App = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col flex-1 w-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/password-reset" element={<ForgotPassword />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map-page"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
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
