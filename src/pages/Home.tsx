import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getUser } from "@/lib/storage";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Monitoring from "@/components/Monitoring";

export default function Home() {
  const nav = useNavigate();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const user = getUser();
    if (user) {
      nav("/dashboard");
    }
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
