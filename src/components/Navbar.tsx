import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { MobileNav } from "./MobileNav";

const Navbar = () => {
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
          <NavLink to="/map-page" className="hover:text-blue-600">
            Draw AOI
          </NavLink>
          <NavLink to="/subscription" className="hover:text-blue-600">
            Plans
          </NavLink>
          <NavLink to="/about-us" className="hover:text-blue-600">
            About-Us
          </NavLink>
          <NavLink to="/contact-us" className="hover:text-blue-600">
            Contact
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex gap-3">
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
