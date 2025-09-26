import { Sheet, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { clearUserData, clearAuthToken } from "../lib/auth";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  // Get auth state from Redux
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = !!user;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  const handleLogout = () => {
    // Clear user data from Redux and localStorage
    clearUserData();
    clearAuthToken();
    setOpen(false);
  };

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
                className="fixed top-0 right-0 z-50 h-screen w-64 bg-black shadow-xl p-6 flex flex-col gap-6"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl text-blue-700 font-['kavoon']">
                    <img
                      src="./assets/team/asset2.png"
                      alt="Logo"
                      className="w-24 h-full object-cover"
                    />
                  </span>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-6 w-6 text-gray-200 border-2 border-gray-200 rounded-full" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </SheetClose>
                </div>

                {/* User Info Section - Only show when logged in */}
                {isLoggedIn && user && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={
                            typeof user.avatar === "string" ? user.avatar : ""
                          }
                          alt={user.username || user.email || "User"}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {user.username || user.email || "User"}
                      </p>
                      <p className="text-xs text-gray-600">Logged in</p>
                    </div>
                  </div>
                )}

                {/* Nav Links */}
                <nav className="flex flex-col gap-4 text-lg text-gray-200">
                  <NavLink
                    to="/map-page"
                    onClick={() => setOpen(false)}
                    className="hover:text-blue-600"
                  >
                    Draw AOI
                  </NavLink>
                  <NavLink
                    to="/careers"
                    onClick={() => setOpen(false)}
                    className="hover:text-blue-600"
                  >
                    Careers
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
                  {!isLoggedIn ? (
                    // Show login and register when not logged in
                    <>
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <Button variant="outline" className="w-full">
                          Login
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setOpen(false)}>
                        <Button className="w-full">Get Started</Button>
                      </Link>
                    </>
                  ) : (
                    // Show logout when logged in
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Sheet>
    </div>
  );
}

// import { Sheet, SheetTrigger, SheetClose } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Menu, X } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Link, NavLink } from "react-router-dom";
// import { useEffect, useState } from "react";

// export function MobileNav() {
//   const [open, setOpen] = useState(false);

//   useEffect(() => {
//     if (open) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//     }
//   }, [open]);

//   return (
//     <div className="md:hidden">
//       <Sheet open={open} onOpenChange={setOpen}>
//         <SheetTrigger asChild>
//           <Button variant="ghost" size="icon">
//             <Menu className="h-6 w-6 text-white" />
//             <span className="sr-only">Open menu</span>
//           </Button>
//         </SheetTrigger>

//         <AnimatePresence>
//           {open && (
//             <>
//               {/* Backdrop */}
//               <motion.div
//                 key="backdrop"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 0.5 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.3 }}
//                 className="fixed inset-0 bg-black z-40"
//                 onClick={() => setOpen(false)}
//               />

//               {/* Drawer */}
//               <motion.div
//                 key="drawer"
//                 initial={{ x: "100%" }}
//                 animate={{ x: 0 }}
//                 exit={{ x: "100%" }}
//                 transition={{ duration: 0.4, ease: "easeInOut" }}
//                 className="fixed top-0 right-0 z-50 h-screen w-64 bg-gray-100 shadow-xl p-6 flex flex-col gap-6"
//               >
//                 <div className="flex justify-between items-center">
//                   <span className="font-bold text-xl text-blue-700 font-['kavoon']">
//                     ASSET WATCH
//                   </span>
//                   <SheetClose asChild>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => setOpen(false)}
//                     >
//                       <X className="h-6 w-6" />
//                       <span className="sr-only">Close</span>
//                     </Button>
//                   </SheetClose>
//                 </div>

//                 {/* Nav Links */}
//                 <nav className="flex flex-col gap-4 text-lg mt-6">
//                   <NavLink
//                     to="/map-page"
//                     onClick={() => setOpen(false)}
//                     className="hover:text-blue-600"
//                   >
//                     Draw AOI
//                   </NavLink>
//                   <NavLink
//                     to="/careers"
//                     onClick={() => setOpen(false)}
//                     className="hover:text-blue-600"
//                   >
//                     Careers
//                   </NavLink>
//                   <NavLink
//                     to="about-us"
//                     onClick={() => setOpen(false)}
//                     className="hover:text-blue-600"
//                   >
//                     About Us
//                   </NavLink>
//                   <NavLink
//                     to="/contact-us"
//                     onClick={() => setOpen(false)}
//                     className="hover:text-blue-600"
//                   >
//                     Contact
//                   </NavLink>
//                 </nav>

//                 {/* Auth Buttons */}
//                 <div className="flex flex-col gap-3 mt-auto">
//                   <Link to="/login" onClick={() => setOpen(false)}>
//                     <Button variant="outline" className="w-full">
//                       Login
//                     </Button>
//                   </Link>
//                   <Link to="/register" onClick={() => setOpen(false)}>
//                     <Button className="w-full">Get Started</Button>
//                   </Link>
//                 </div>
//               </motion.div>
//             </>
//           )}
//         </AnimatePresence>
//       </Sheet>
//     </div>
//   );
// }
