"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useInView,
} from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Satellite, ShieldCheck, Activity, Cloud } from "lucide-react";

type Feature = {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
};

const features: Feature[] = [
  {
    id: 1,
    title: "Real-Time Asset Monitoring",
    description:
      "Track and visualize your assets from space with live satellite updates, ensuring full visibility at any time.",
    icon: Satellite,
  },
  {
    id: 2,
    title: "Predictive Insights",
    description:
      "Leverage AI-driven analytics to anticipate changes and detect anomalies before they become issues.",
    icon: Activity,
  },
  {
    id: 3,
    title: "Data Security",
    description:
      "Your asset data is safeguarded with enterprise-grade encryption and secure access protocols.",
    icon: ShieldCheck,
  },
  {
    id: 4,
    title: "Cloud Integration",
    description:
      "Seamlessly integrate with existing cloud platforms for unified data management and collaboration.",
    icon: Cloud,
  },
];

type Stat = {
  id: number;
  label: string;
  value: string;
  target: number; // Add target for numeric counting
};

const stats: Stat[] = [
  { id: 1, label: "Uptime Guarantee", value: "99.9%", target: 99.9 },
  { id: 2, label: "Global Clients", value: "250+", target: 250 },
  { id: 3, label: "Accuracy Rate", value: "95%", target: 95 },
  { id: 4, label: "Countries Covered", value: "50+", target: 50 },
];

function TiltCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-50, 50], [15, -15]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-50, 50], [-15, 15]), {
    stiffness: 200,
    damping: 20,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;
    x.set(offsetX / 5);
    y.set(offsetY / 5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000"
    >
      {children}
    </motion.div>
  );
}

export default function Features() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const statsRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(statsRef, { once: true, amount: 0.3 });
  const [counters, setCounters] = useState<number[]>(stats.map(() => 0));

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  // Counter animation logic
  useEffect(() => {
    if (isInView) {
      const duration = 2000; // Animation duration in ms
      const steps = 60; // Number of frames
      const interval = duration / steps;

      const timers = stats.map((stat, index) => {
        const target = stat.target;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setCounters((prev) =>
            prev.map((val, i) => (i === index ? current : val))
          );
        }, interval);

        return timer;
      });

      return () => timers.forEach(clearInterval);
    }
  }, [isInView]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border-b border-gray-700"
    >
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 bg-[url('/stars1.png')] bg-cover bg-center opacity-40"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 bg-[url('/stars2.png')] bg-cover bg-center opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      <section className="relative w-full pt-16 pb-32 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Powerful Features to Monitor Your Assets
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Designed to give you real-time insights and control over your assets
            from space, with secure, predictive, and scalable technology.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.7 }}
                viewport={{ once: true }}
              >
                <TiltCard>
                  <Card className="h-full cursor-pointer border border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                    <CardHeader>
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 3,
                          ease: "easeInOut",
                        }}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/80 text-white mb-4 mx-auto"
                      >
                        <Icon className="w-6 h-6" />
                      </motion.div>
                      <CardTitle className="text-lg font-semibold text-center text-white">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 text-center">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="relative w-full py-16 px-4 md:px-8 lg:px-16 bg-black/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Why Choose Us?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            We combine cutting-edge satellite technology, AI-driven insights,
            and enterprise-grade security to give you the best asset monitoring
            platform available.
          </p>
        </div>
        <div
          ref={statsRef}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12 relative z-10"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-4xl font-extrabold text-white">
                {stat.value.includes("%")
                  ? `${Math.round(counters[index] * 10) / 10}%`
                  : Math.round(counters[index]) + "+"}
              </p>
              <p className="text-gray-400 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Button
            size="lg"
            className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg my-4"
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
}
