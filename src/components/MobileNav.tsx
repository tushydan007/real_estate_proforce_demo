import { Sheet, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6 text-white" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>

        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setOpen(false)}
              />

              {/* Drawer */}
              <motion.div
                key="drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="fixed top-0 right-0 z-50 h-screen w-64 bg-gray-100 shadow-xl p-6 flex flex-col gap-6"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl text-blue-700 font-['kavoon']">
                    ASSET WATCH
                  </span>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </SheetClose>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col gap-4 text-lg mt-6">
                  <NavLink
                    to="/map-page"
                    onClick={() => setOpen(false)}
                    className="hover:text-blue-600"
                  >
                    Draw AOI
                  </NavLink>
                  <NavLink
                    to="/subscriptions"
                    onClick={() => setOpen(false)}
                    className="hover:text-blue-600"
                  >
                    Plans
                  </NavLink>
                  <NavLink
                    to="about-us"
                    onClick={() => setOpen(false)}
                    className="hover:text-blue-600"
                  >
                    About Us
                  </NavLink>
                  <NavLink
                    to="/contact-us"
                    onClick={() => setOpen(false)}
                    className="hover:text-blue-600"
                  >
                    Contact
                  </NavLink>
                </nav>

                {/* Auth Buttons */}
                <div className="flex flex-col gap-3 mt-auto">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Sheet>
    </div>
  );
}
