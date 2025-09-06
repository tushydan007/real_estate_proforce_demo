// "use client";

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
// import { Satellite, ShieldCheck, Activity, Cloud } from "lucide-react";
// import { useRef } from "react";

// type Feature = {
//   id: number;
//   title: string;
//   description: string;
//   icon: React.ElementType;
// };

// const features: Feature[] = [
//   {
//     id: 1,
//     title: "Real-Time Asset Monitoring",
//     description:
//       "Track and visualize your assets from space with live satellite updates, ensuring full visibility at any time.",
//     icon: Satellite,
//   },
//   {
//     id: 2,
//     title: "Predictive Insights",
//     description:
//       "Leverage AI-driven analytics to anticipate changes and detect anomalies before they become issues.",
//     icon: Activity,
//   },
//   {
//     id: 3,
//     title: "Data Security",
//     description:
//       "Your asset data is safeguarded with enterprise-grade encryption and secure access protocols.",
//     icon: ShieldCheck,
//   },
//   {
//     id: 4,
//     title: "Cloud Integration",
//     description:
//       "Seamlessly integrate with existing cloud platforms for unified data management and collaboration.",
//     icon: Cloud,
//   },
// ];

// const stats = [
//   { id: 1, label: "Uptime Guarantee", value: "99.9%" },
//   { id: 2, label: "Global Clients", value: "250+" },
//   { id: 3, label: "Accuracy Rate", value: "95%" },
//   { id: 4, label: "Countries Covered", value: "50+" },
// ];

// const cardVariants = {
//   hidden: { opacity: 0, y: 40 },
//   visible: (i: number) => ({
//     opacity: 1,
//     y: 0,
//     transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
//   }),
// };

// // Reusable Tilt Card
// function TiltCard({ children }: { children: React.ReactNode }) {
//   const x = useMotionValue(0);
//   const y = useMotionValue(0);

//   const rotateX = useSpring(useTransform(y, [-50, 50], [15, -15]), { stiffness: 200, damping: 20 });
//   const rotateY = useSpring(useTransform(x, [-50, 50], [-15, 15]), { stiffness: 200, damping: 20 });

//   function handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
//     const rect = e.currentTarget.getBoundingClientRect();
//     const offsetX = e.clientX - rect.left - rect.width / 2;
//     const offsetY = e.clientY - rect.top - rect.height / 2;
//     x.set(offsetX / 5); // scale down effect
//     y.set(offsetY / 5);
//   }

//   function handleMouseLeave() {
//     x.set(0);
//     y.set(0);
//   }

//   return (
//     <motion.div
//       style={{ rotateX, rotateY }}
//       onMouseMove={handleMouseMove}
//       onMouseLeave={handleMouseLeave}
//       className="perspective-1000"
//     >
//       {children}
//     </motion.div>
//   );
// }

// export default function Features() {
//   const ref = useRef(null);
//   const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

//   // Multi-layer parallax speeds
//   const starsY = useTransform(scrollYProgress, [0, 1], [0, 80]);
//   const orb1Y = useTransform(scrollYProgress, [0, 1], [0, 120]);
//   const orb2Y = useTransform(scrollYProgress, [0, 1], [0, -100]);

//   return (
//     <div ref={ref}>

//       {/* Features Section */}
//       <section className="relative w-full py-16 px-4 md:px-8 lg:px-16 overflow-hidden">
//         {/* Stars Parallax Background */}
//         <motion.div
//           style={{ y: starsY }}
//           className="absolute inset-0 -z-20 bg-[url('/stars.svg')] bg-repeat opacity-30"
//         />
//         {/* Base Gradient */}
//         <div className="absolute inset-0 -z-30 bg-gradient-to-b from-indigo-900 via-gray-900 to-black dark:from-black dark:via-gray-950 dark:to-black" />

//         {/* Parallax Gradient Orbs */}
//         <motion.div
//           style={{ y: orb1Y }}
//           className="absolute -top-32 -left-32 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl -z-10"
//         />
//         <motion.div
//           style={{ y: orb2Y }}
//           className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10"
//         />

//         {/* Title */}
//         <div className="max-w-6xl mx-auto text-center mb-12 relative z-10">
//           <motion.h2
//             initial={{ opacity: 0, y: -20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.8 }}
//             className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
//           >
//             Powerful Features to Monitor Your Assets
//           </motion.h2>
//           <motion.p
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             transition={{ delay: 0.2, duration: 0.8 }}
//             className="text-gray-300 max-w-2xl mx-auto"
//           >
//             Designed to give you real-time insights and control over your assets
//             from space, with secure, predictive, and scalable technology.
//           </motion.p>
//         </div>

//         {/* Feature Cards with Tilt */}
//         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
//           {features.map((feature, index) => {
//             const Icon = feature.icon;
//             return (
//               <motion.div
//                 key={feature.id}
//                 variants={cardVariants}
//                 initial="hidden"
//                 whileInView="visible"
//                 custom={index}
//                 viewport={{ once: true }}
//               >
//                 <TiltCard>
//                   <Card className="h-full border border-gray-700 bg-gray-900/60 backdrop-blur-md text-white shadow-lg hover:shadow-2xl rounded-2xl transition-transform">
//                     <CardHeader>
//                       <motion.div
//                         animate={{ y: [0, -5, 0] }}
//                         transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
//                         className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4 mx-auto"
//                       >
//                         <Icon className="w-6 h-6" />
//                       </motion.div>
//                       <CardTitle className="text-lg font-semibold text-center">
//                         {feature.title}
//                       </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-sm text-gray-300 text-center">
//                         {feature.description}
//                       </p>
//                     </CardContent>
//                   </Card>
//                 </TiltCard>
//               </motion.div>
//             );
//           })}
//         </div>
//       </section>

//       {/* Why Choose Us Section */}
//       <section className="relative w-full py-20 px-4 md:px-8 lg:px-16 overflow-hidden">
//         {/* Stars Background */}
//         <motion.div
//           style={{ y: starsY }}
//           className="absolute inset-0 -z-20 bg-[url('/stars.svg')] bg-repeat opacity-30"
//         />
//         {/* Base Gradient */}
//         <div className="absolute inset-0 -z-30 bg-gradient-to-b from-black via-gray-950 to-gray-900" />

//         {/* Orbs */}
//         <motion.div
//           style={{ y: orb1Y }}
//           className="absolute top-20 left-1/4 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl -z-10"
//         />
//         <motion.div
//           style={{ y: orb2Y }}
//           className="absolute bottom-10 right-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -z-10"
//         />

//         {/* Title */}
//         <div className="max-w-6xl mx-auto text-center mb-12 relative z-10">
//           <motion.h2
//             initial={{ opacity: 0, y: -20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             viewport={{ once: true }}
//             transition={{ duration: 0.8 }}
//             className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4"
//           >
//             Why Choose Us?
//           </motion.h2>
//           <motion.p
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             transition={{ delay: 0.2, duration: 0.8 }}
//             className="text-gray-300 max-w-2xl mx-auto"
//           >
//             We combine cutting-edge satellite technology, AI-driven insights, and enterprise-grade security to give you the best asset monitoring platform available.
//           </motion.p>
//         </div>

//         {/* Stats */}
//         <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12 relative z-10">
//           {stats.map((stat, index) => (
//             <motion.div
//               key={stat.id}
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.2, duration: 0.6 }}
//               viewport={{ once: true }}
//               className="text-center"
//             >
//               <motion.p
//                 initial={{ scale: 0.8 }}
//                 whileInView={{ scale: 1 }}
//                 transition={{ duration: 0.6, delay: index * 0.2 }}
//                 className="text-4xl font-extrabold text-primary"
//               >
//                 {stat.value}
//               </motion.p>
//               <p className="text-gray-400 mt-2">{stat.label}</p>
//             </motion.div>
//           ))}
//         </div>

//         {/* CTA */}
//         <div className="text-center relative z-10">
//           <motion.div
//             animate={{ scale: [1, 1.05, 1] }}
//             transition={{ repeat: Infinity, duration: 3 }}
//           >
//             <Button
//               size="lg"
//               className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl"
//             >
//               Get Started Today
//             </Button>
//           </motion.div>
//         </div>
//       </section>
//     </div>
//   );
// }

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
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

const stats = [
  { id: 1, label: "Uptime Guarantee", value: "99.9%" },
  { id: 2, label: "Global Clients", value: "250+" },
  { id: 3, label: "Accuracy Rate", value: "95%" },
  { id: 4, label: "Countries Covered", value: "50+" },
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax movement for stars
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div ref={containerRef} className="relative overflow-hidden border-b border-gray-700">
      {/* Starfield background with parallax */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 bg-[url('/stars1.png')] bg-cover bg-center opacity-40"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 bg-[url('/stars2.png')] bg-cover bg-center opacity-25"
      />

      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Features Section */}
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
                <Card className="h-full border border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/80 text-white mb-4 mx-auto">
                      <Icon className="w-6 h-6" />
                    </div>
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
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Why Choose Us Section */}
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

        {/* Stats */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12 relative z-10">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-4xl font-extrabold text-white">{stat.value}</p>
              <p className="text-gray-400 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            className="rounded-full px-8 py-6 text-base shadow-md bg-white text-black hover:bg-white/80 transition-colors"
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
}
