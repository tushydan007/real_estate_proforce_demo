import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { MobileNav } from "./MobileNav";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-md h-16">
      <div className="max-w-[1650px] mx-auto flex justify-between items-center px-6 py-4">
        {/* Brand */}
        <Link to="/" className="text-xl font-bold text-blue-700">
          Proforce Galaxies
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 text-gray-700">
          <NavLink to="#features" className="hover:text-blue-600">
            Features
          </NavLink>

          <NavLink to="/map-page" className="hover:text-blue-600">
            Map
          </NavLink>
          <NavLink to="/subscription" className="hover:text-blue-600">
            Plans
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
