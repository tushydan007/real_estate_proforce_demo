import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { MobileNav } from "./MobileNav";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-md h-16">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold text-blue-700">
          Proforce Galaxies
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 text-gray-700">
          <NavLink to="#features" className="hover:text-blue-600">
            Features
          </NavLink>
          <NavLink to="#how-it-works" className="hover:text-blue-600">
            How it Works
          </NavLink>
          <NavLink to="/map-page" className="hover:text-blue-600">
            Map
          </NavLink>
          <NavLink to="#plans" className="hover:text-blue-600">
            Plans
          </NavLink>
          <NavLink to="#contact" className="hover:text-blue-600">
            Contact
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex gap-3">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
        {/* Mobile Menu */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

// import React from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { clearAuthToken, getUser } from "../lib/auth";

// const Navbar: React.FC = () => {
//   const user = getUser();
//   const navigate = useNavigate();

//   function handleLogout() {
//     clearAuthToken();
//     navigate("/login");
//   }

//   return (
//     <nav className="bg-white shadow">
//       <div className="container mx-auto p-4 flex justify-between items-center">
//         <Link to="/" className="font-bold text-lg">
//           MySaaS
//         </Link>
//         <div className="space-x-4">
//           <Link to="/subscription" className="text-sm">
//             Plans
//           </Link>
//           {user ? (
//             <>
//               <Link to="/dashboard" className="text-sm">
//                 Dashboard
//               </Link>
//               <button onClick={handleLogout} className="text-sm text-red-600">
//                 Logout
//               </button>
//             </>
//           ) : (
//             <>
//               <Link to="/login" className="text-sm">
//                 Login
//               </Link>
//               <Link to="/register" className="text-sm">
//                 Register
//               </Link>
//             </>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;
