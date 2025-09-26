import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { MobileNav } from "./MobileNav";
import { ShoppingCart, LogOut, User } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { motion } from "framer-motion";
import { clearAuthToken, clearUserData } from "../lib/auth";

const Navbar = () => {
  // const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = useSelector((state: RootState) =>
    state.cart.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  const totalCount = useSelector(
    (state: RootState) => state.aoiCart.totalCount
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = !!user;

  const handleLogout = () => {
    clearAuthToken();
    clearUserData();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#101828] backdrop-blur-md shadow-md h-16">
      <div className="max-w-[1650px] mx-auto flex justify-between items-center px-6 py-4">
        {/* Brand */}
        <Link
          to="/"
          className="font-normal text-2xl bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text font-['kavoon']"
        >
          <img src="/assets/team/preferred.png" alt="Logo" className="w-24 h-full object-cover" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-12 text-gray-300 font-medium">
          <NavLink
            to="/map-page"
            className={({ isActive }) =>
              isActive ? "text-blue-500 font-semibold" : "hover:text-blue-600"
            }
          >
            Draw AOI
          </NavLink>

          <NavLink
            to="/careers"
            className={({ isActive }) =>
              isActive ? "text-blue-500 font-semibold" : "hover:text-blue-600"
            }
          >
            Careers
          </NavLink>

          <NavLink
            to="/about-us"
            className={({ isActive }) =>
              isActive ? "text-blue-500 font-semibold" : "hover:text-blue-600"
            }
          >
            About Us
          </NavLink>

          <NavLink
            to="/contact-us"
            className={({ isActive }) =>
              isActive ? "text-blue-500 font-semibold" : "hover:text-blue-600"
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex gap-4 items-center">
          {/* Cart */}
          <Link to="/cart" className="relative mr-4">
            <ShoppingCart className="w-6 h-6 text-gray-300 hover:text-blue-500" />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
              >
                {totalCount}
              </motion.span>
            )}
          </Link>

          {/* Auth Buttons */}
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" title="Go to Dashboard">
                <Button variant="outline" className="cursor-pointer p-2">
                  <User className="w-5 h-5 text-gray-900 hover:text-blue-500" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" state={{ from: location }}>
                <Button variant="outline" className="cursor-pointer">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="cursor-pointer">Get Started</Button>
              </Link>
            </>
          )}
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
