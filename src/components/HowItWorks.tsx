import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  "Sign up and start your free trial.",
  "Select your assets & regions of interest.",
  "Receive satellite-driven insights in your dashboard.",
];

const HowItWorks = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax star movement
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div ref={containerRef} className="relative overflow-hidden pt-6 pb-16">
      {/* Starfield background with parallax (from Features) */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 bg-[url('/stars1.png')] bg-cover bg-center opacity-40"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 bg-[url('/stars2.png')] bg-cover bg-center opacity-25"
      />

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      <section id="how-it-works" className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {data.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="h-full border border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg hover:shadow-2xl hover:border-blue-600/50 transition-all duration-300 rounded-2xl relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-center text-white relative z-10">
                      Step {idx + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 text-center relative z-10">
                      {step}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;

// import { motion, useScroll, useTransform } from "framer-motion";
// import { useRef } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// const data = [
//   "Sign up and start your free trial.",
//   "Select your assets & regions of interest.",
//   "Receive satellite-driven insights in your dashboard.",
// ];

// const HowItWorks = () => {
//   const containerRef = useRef<HTMLDivElement | null>(null);
//   const { scrollYProgress } = useScroll({
//     target: containerRef,
//     offset: ["start start", "end end"],
//   });

//   // Parallax star movement
//   const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
//   const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

//   return (
//     <div ref={containerRef} className="relative overflow-hidden pt-6 pb-16">
//       {/* Starfield background with parallax (from Features) */}
//       <motion.div
//         style={{ y: y1 }}
//         className="absolute inset-0 bg-[url('/stars1.png')] bg-cover bg-center opacity-40"
//       />
//       <motion.div
//         style={{ y: y2 }}
//         className="absolute inset-0 bg-[url('/stars2.png')] bg-cover bg-center opacity-25"
//       />

//       {/* Overlay gradient */}
//       <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

//       <section id="how-it-works" className="relative py-16 px-6">
//         <div className="max-w-7xl mx-auto">
//           <h2 className="text-3xl font-bold text-center mb-12 text-white">
//             How It Works
//           </h2>

//           <div className="grid md:grid-cols-3 gap-8 relative z-10">
//             {data.map((step, idx) => (
//               <motion.div
//                 key={idx}
//                 initial={{ opacity: 0, y: 30 }}
//                 whileInView={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.6, delay: idx * 0.2 }}
//                 viewport={{ once: true }}
//               >
//                 <Card className="h-full border border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
//                   <CardHeader>
//                     {/* <span className="block text-4xl font-bold text-white mb-4 font-[kavoon] text-center">
//                       {idx + 1}
//                     </span> */}
//                     <CardTitle className="text-lg font-semibold text-center text-white">
//                       Step {idx + 1}
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-sm text-gray-400 text-center">{step}</p>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             ))}
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default HowItWorks;
