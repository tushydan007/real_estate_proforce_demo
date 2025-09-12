import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { MobileNav } from "./MobileNav";
import { ShoppingCart } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { motion } from "framer-motion";

const Navbar = () => {
  const cartCount = useSelector((state: RootState) =>
    state.cart.items.reduce((acc, item) => acc + item.quantity, 0)
  );
  const totalCount = useSelector(
    (state: RootState) => state.aoiCart.totalCount
  );

  return (
    <header className="sticky top-0 z-50 bg-[#101828] backdrop-blur-md shadow-md h-16">
      <div className="max-w-[1650px] mx-auto flex justify-between items-center px-6 py-4">
        {/* Brand */}
        <Link
          to="/"
          className="font-normal text-2xl bg-gradient-to-r from-[#3B82F6] to-[#3f33ea] text-transparent bg-clip-text font-['kavoon']"
        >
          ASSET WATCH
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
            to="/subscription"
            className={({ isActive }) =>
              isActive ? "text-blue-500 font-semibold" : "hover:text-blue-600"
            }
          >
            Plans
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
                className="absolute -top-2 -right-2 bg-gradient-to-r from-[#3B82F6] to-[#3f33ea] text-gray-200 text-xs font-bold px-2 py-0.5 rounded-full"
              >
                {totalCount}
              </motion.span>
            )}
          </Link>

          {/* Auth Buttons */}
          <Link to="/login">
            <Button variant="outline" className="cursor-pointer">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button className="cursor-pointer">Get Started</Button>
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
