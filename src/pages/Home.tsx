import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Globe from "react-globe.gl";
import { useRef, useEffect } from "react";
import type { GlobeMethods } from "react-globe.gl";
import { getUser } from "@/lib/storage";

const data = [
  "Sign up and start your free trial.",
  "Select your assets & regions of interest.",
  "Receive satellite-driven insights in your dashboard.",
];

export default function Home() {
  const nav = useNavigate();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    const user = getUser();
    if (user) {
      nav("/dashboard");
    }
  }, [nav]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col-reverse md:flex-row items-center justify-between flex-grow px-6 py-16 max-w-7xl mx-auto">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-lg text-center md:text-left"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Monitor Your Assets from Space
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Harness cutting-edge satellite data and geospatial technology to
            monitor, analyze, and protect your assets in real time.
          </p>
          <Link to="/register">
            <Button size="lg" className="cursor-pointer">
              Start Free Trial
            </Button>
          </Link>
        </motion.div>

        {/* Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="w-full md:w-1/2 h-64 sm:h-72 md:h-80 lg:h-[500px] flex items-center justify-center relative overflow-hidden"
        >
          <div className="w-full h-full flex items-center justify-center">
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              width={undefined}
              height={undefined}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-Time Monitoring",
                desc: "Track your assets globally with live satellite updates.",
              },
              {
                title: "AI Insights",
                desc: "Leverage machine learning to detect anomalies & risks.",
              },
              {
                title: "Secure Platform",
                desc: "Enterprise-grade security with user-friendly access.",
              },
            ].map((f, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {data.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="bg-blue-50 p-6 rounded-2xl shadow-sm"
              >
                <span className="block text-4xl font-bold text-blue-600 mb-4">
                  {idx + 1}
                </span>
                <p className="text-gray-700">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="plans"
        className="bg-blue-600 py-16 px-6 text-white text-center"
      >
        <h2 className="text-3xl font-bold mb-6">Start Monitoring Today</h2>
        <p className="mb-8 text-lg">
          Enjoy a 7-day free trial, then upgrade to unlock premium features.
        </p>
        <Link to="/subscription">
          <Button size="lg" variant="secondary">
            View Plans
          </Button>
        </Link>
      </section>
    </div>
  );
}
