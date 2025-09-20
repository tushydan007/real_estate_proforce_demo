import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import client from "../lib/client";
import type { AxiosError } from "axios";
import { motion } from "framer-motion";
// Import Redux hooks and actions
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { setToken } from "../redux/features/auth/authSlice";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  async function onSubmit(values: LoginFormData) {
    try {
      const { data } = await client.post("/api/auth/jwt/create/", values);
      console.log(data);

      // Extract token from various possible response formats
      const token = data?.key || data?.token || data?.access;

      if (!token) {
        throw new Error("No authentication token received");
      }

      // Use Redux action to store token and automatically decode user
      dispatch(setToken(token));

      toast.success("Login successful 🎉");

      // Check if there's a previous URL in location.state
      const from = location.state?.from?.pathname || "/";

      // Small delay to ensure Redux state is updated before navigation
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    } catch (err: unknown) {
      let errorMsg = "Something went wrong. Please try again.";

      if ((err as AxiosError)?.isAxiosError) {
        const axiosErr = err as AxiosError<{
          detail?: string;
          non_field_errors?: string[];
          email?: string[];
          password?: string[];
        }>;
        const respData = axiosErr.response?.data;

        if (respData?.detail) {
          errorMsg = respData.detail;
        } else if (Array.isArray(respData?.non_field_errors)) {
          errorMsg = respData.non_field_errors[0];
        } else if (respData?.email && Array.isArray(respData.email)) {
          errorMsg = `Email: ${respData.email[0]}`;
        } else if (respData?.password && Array.isArray(respData.password)) {
          errorMsg = `Password: ${respData.password[0]}`;
        } else if (axiosErr.response?.status === 401) {
          errorMsg = "Invalid email or password";
        } else if (axiosErr.response?.status === 429) {
          errorMsg = "Too many login attempts. Please try again later.";
        } else {
          errorMsg = axiosErr.message || errorMsg;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
      console.error("Login error:", err);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      {/* Card animation */}
      <motion.div
        className="w-full max-w-md rounded-2xl bg-[#0C111C] p-8 shadow-lg"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.h2
          className="mb-6 text-center text-3xl font-bold text-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Login
        </motion.h2>

        {/* Form with staggered fade-in */}
        <motion.form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          {/* Email */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-200"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="mt-1 w-full rounded-lg border border-gray-400 bg-transparent px-3 py-2 text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="mt-1 w-full rounded-lg border border-gray-400 bg-transparent px-3 py-2 text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 disabled:opacity-50"
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 
                         0-1.485.324-2.892.9-4.125M4.22 4.22l15.56 15.56M9.88 9.88
                         A3 3 0 0114.12 14.12"
                    />
                  </svg>
                ) : (
                  // Eye icon
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 
                         7.523 5 12 5c4.477 0 8.268 2.943 
                         9.542 7-1.274 4.057-5.065 7-9.542 
                         7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* Submit Button with press effect */}
          <motion.button
            type="submit"
            disabled={!isValid || isSubmitting}
            whileTap={{ scale: 0.95 }}
            className={`w-full flex items-center justify-center rounded-lg py-2 px-4 font-medium transition-all duration-200 ${
              !isValid || isSubmitting
                ? "cursor-not-allowed bg-[#3c3c3c] text-gray-400"
                : "cursor-pointer bg-white text-black hover:bg-gray-200 transform hover:scale-[1.02]"
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 
                       0 00-4 4H4z"
                  ></path>
                </svg>
                <span className="ml-2">Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </motion.button>

          {/* Footer Links */}
          <motion.div
            className="text-center"
            variants={{
              hidden: { opacity: 0, y: 15 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <div className="flex flex-col items-center gap-2 pt-4 sm:flex-row sm:justify-between sm:gap-6">
              <Link
                to="/password-reset"
                className="text-sm text-blue-600 hover:underline transition-colors duration-200 hover:text-blue-400"
              >
                Forgot password?
              </Link>
              <Link
                to="/register"
                className="text-sm text-blue-600 hover:underline transition-colors duration-200 hover:text-blue-400"
              >
                Don't have an account?{" "}
                <span className="font-medium">Register</span>
              </Link>
            </div>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
}













// import { useState } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import toast from "react-hot-toast";
// import client from "../lib/client";
// import { saveAuthToken, saveUser } from "../lib/auth";
// import type { AxiosError } from "axios";
// import { motion } from "framer-motion";
// // Import Redux hooks and actions
// import { useDispatch } from "react-redux";
// import type { AppDispatch } from "../redux/store";
// import { setUser } from "../redux/features/auth/authSlice";

// // Validation schema
// const loginSchema = z.object({
//   email: z.string().email("Invalid email address"),
//   password: z.string().min(6, "Password must be at least 6 characters"),
// });

// type LoginFormData = z.infer<typeof loginSchema>;

// export default function Login() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const dispatch = useDispatch<AppDispatch>();
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting, isValid },
//   } = useForm<LoginFormData>({
//     resolver: zodResolver(loginSchema),
//     mode: "onChange",
//   });

//   async function onSubmit(values: LoginFormData) {
//     try {
//       const { data } = await client.post("/api/auth/jwt/create/", values);
//       console.log(data)

//       const token = data?.key || data?.token || data?.access;
//       if (token) saveAuthToken(token);
//       if (data?.user) {
//         saveUser(data.user);
//         // Dispatch user data to Redux store
//         dispatch(setUser(data.user));
//       }

//       toast.success("Login successful 🎉");

//       // Check if there's a previous URL in location.state
//       const from = location.state?.from?.pathname || "/";

//       // Small delay to ensure Redux state is updated before navigation
//       setTimeout(() => {
//         navigate(from, { replace: true });
//       }, 100);
//     } catch (err: unknown) {
//       let errorMsg = "Something went wrong. Please try again.";

//       if ((err as AxiosError)?.isAxiosError) {
//         const axiosErr = err as AxiosError<{
//           detail?: string;
//           non_field_errors?: string[];
//         }>;
//         const respData = axiosErr.response?.data;

//         if (respData?.detail) {
//           errorMsg = respData.detail;
//         } else if (Array.isArray(respData?.non_field_errors)) {
//           errorMsg = respData.non_field_errors[0];
//         } else {
//           errorMsg = axiosErr.message || errorMsg;
//         }
//       }

//       toast.error(errorMsg);
//     }
//   }

//   return (
//     <div className="flex min-h-screen items-center justify-center bg-black px-4">
//       {/* Card animation */}
//       <motion.div
//         className="w-full max-w-md rounded-2xl bg-[#0C111C] p-8 shadow-lg"
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6, ease: "easeOut" }}
//       >
//         <motion.h2
//           className="mb-6 text-center text-3xl font-bold text-gray-200"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2, duration: 0.5 }}
//         >
//           Login
//         </motion.h2>

//         {/* Form with staggered fade-in */}
//         <motion.form
//           onSubmit={handleSubmit(onSubmit)}
//           className="space-y-5"
//           noValidate
//           initial="hidden"
//           animate="visible"
//           variants={{
//             hidden: {},
//             visible: {
//               transition: { staggerChildren: 0.15 },
//             },
//           }}
//         >
//           {/* Email */}
//           <motion.div
//             variants={{
//               hidden: { opacity: 0, y: 15 },
//               visible: { opacity: 1, y: 0 },
//             }}
//           >
//             <label
//               htmlFor="email"
//               className="block text-sm font-medium text-gray-200"
//             >
//               Email
//             </label>
//             <input
//               id="email"
//               type="email"
//               autoComplete="email"
//               {...register("email")}
//               className="mt-1 w-full rounded-lg border border-gray-400 bg-transparent px-3 py-2 text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
//               placeholder="Enter your email"
//             />
//             {errors.email && (
//               <p className="mt-1 text-sm text-red-600">
//                 {errors.email.message}
//               </p>
//             )}
//           </motion.div>

//           {/* Password */}
//           <motion.div
//             variants={{
//               hidden: { opacity: 0, y: 15 },
//               visible: { opacity: 1, y: 0 },
//             }}
//           >
//             <label
//               htmlFor="password"
//               className="block text-sm font-medium text-gray-200"
//             >
//               Password
//             </label>
//             <div className="relative mt-1">
//               <input
//                 id="password"
//                 type={showPassword ? "text" : "password"}
//                 autoComplete="current-password"
//                 {...register("password")}
//                 className="mt-1 w-full rounded-lg border border-gray-400 bg-transparent px-3 py-2 text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
//                 placeholder="Enter your password"
//               />
//               <button
//                 type="button"
//                 aria-label={showPassword ? "Hide password" : "Show password"}
//                 onClick={() => setShowPassword((prev) => !prev)}
//                 className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200"
//               >
//                 {showPassword ? (
//                   // Eye-off icon
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10
//                          0-1.485.324-2.892.9-4.125M4.22 4.22l15.56 15.56M9.88 9.88
//                          A3 3 0 0114.12 14.12"
//                     />
//                   </svg>
//                 ) : (
//                   // Eye icon
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                     />
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M2.458 12C3.732 7.943
//                          7.523 5 12 5c4.477 0 8.268 2.943
//                          9.542 7-1.274 4.057-5.065 7-9.542
//                          7-4.477 0-8.268-2.943-9.542-7z"
//                     />
//                   </svg>
//                 )}
//               </button>
//             </div>
//             {errors.password && (
//               <p className="mt-1 text-sm text-red-600">
//                 {errors.password.message}
//               </p>
//             )}
//           </motion.div>

//           {/* Submit Button with press effect */}
//           <motion.button
//             type="submit"
//             disabled={!isValid || isSubmitting}
//             whileTap={{ scale: 0.95 }}
//             className={`w-full flex items-center justify-center rounded-lg py-2 px-4 font-medium transition ${
//               !isValid || isSubmitting
//                 ? "cursor-not-allowed bg-[#3c3c3c] text-gray-400"
//                 : "cursor-pointer bg-white text-black hover:bg-gray-200"
//             }`}
//           >
//             {isSubmitting ? (
//               <>
//                 <svg
//                   className="h-5 w-5 animate-spin text-black"
//                   xmlns="http://www.w3.org/2000/svg"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   ></circle>
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v4a4 4
//                        0 00-4 4H4z"
//                   ></path>
//                 </svg>
//                 <span className="ml-2">Logging in...</span>
//               </>
//             ) : (
//               "Login"
//             )}
//           </motion.button>

//           {/* Footer Links */}
//           <motion.div
//             className="text-center"
//             variants={{
//               hidden: { opacity: 0, y: 15 },
//               visible: { opacity: 1, y: 0 },
//             }}
//           >
//             <div className="flex flex-col items-center gap-2 pt-4 sm:flex-row sm:justify-between sm:gap-6">
//               <Link
//                 to="/password-reset"
//                 className="text-sm text-blue-600 hover:underline"
//               >
//                 Forgot password?
//               </Link>
//               <Link
//                 to="/register"
//                 className="text-sm text-blue-600 hover:underline"
//               >
//                 Don't have an account?{" "}
//                 <span className="font-medium">Register</span>
//               </Link>
//             </div>
//           </motion.div>
//         </motion.form>
//       </motion.div>
//     </div>
//   );
// }
