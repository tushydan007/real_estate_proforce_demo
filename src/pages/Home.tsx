import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { getUser } from "@/lib/storage";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Monitoring from "@/components/Monitoring";
import client from "@/lib/client";


interface CartIdSetter {
  (cartId: string): void;
}

// Cart utility functions
const getCartId = () => {
  return localStorage.getItem("cartId");
};

const setCartId: CartIdSetter = (cartId) => {
  localStorage.setItem("cartId", cartId);
};

const createCart = async () => {
  try {
    const response = await client.post(
      "/api/cart",
      {
        // Add any required fields for cart creation
        // timestamp: new Date().toISOString(),
        // userId: null, // For guest users
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // Axios automatically parses JSON response
    return response.data.cartId; // Assuming your API returns { cartId: "some-id" }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle Axios-specific errors
      if (error.response) {
        // Server responded with error status
        console.error(
          "Cart creation failed:",
          error.response.status,
          error.response.data
        );
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
      } else {
        // Something else happened
        console.error("Error setting up request:", error.message);
      }
    } else {
      console.error("Unexpected error:", error);
    }
    return null;
  }
};

export default function Home() {
  const nav = useNavigate();

  // Initialize cart and redirect logged-in users
  useEffect(() => {
    const initializeCart = async () => {
      // Check if cart ID already exists
      const existingCartId = getCartId();

      if (!existingCartId) {
        // Create new cart if none exists
        const newCartId = await createCart();
        if (newCartId) {
          setCartId(newCartId);
          console.log("New cart created:", newCartId);
        } else {
          console.error("Failed to create cart");
        }
      } else {
        console.log("Existing cart found:", existingCartId);
      }
    };

    // Check user authentication and redirect if needed
    const user = getUser();
    if (user) {
      nav("/dashboard");
      return; // Don't initialize cart if redirecting
    }

    // Initialize cart for non-authenticated users
    initializeCart();
  }, [nav]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Hero />
      <Features />
      <HowItWorks />
      <Monitoring />
    </div>
  );
}

// import { useNavigate } from "react-router-dom";
// import { useEffect } from "react";
// import { getUser } from "@/lib/storage";
// import Hero from "@/components/Hero";
// import Features from "@/components/Features";
// import HowItWorks from "@/components/HowItWorks";
// import Monitoring from "@/components/Monitoring";

// export default function Home() {
//   const nav = useNavigate();

//   // Redirect logged-in users to dashboard
//   useEffect(() => {
//     const user = getUser();
//     if (user) {
//       nav("/dashboard");
//     }
//   }, [nav]);

//   return (
//     <div className="flex flex-col min-h-screen bg-black">
//       <Hero />
//       <Features />
//       <HowItWorks />
//       <Monitoring />
//     </div>
//   );
// }
