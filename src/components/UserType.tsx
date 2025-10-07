import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { User, Building2 } from "lucide-react";

const UserTypes = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax star movement
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Starfield background with parallax */}
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

      <section className="relative py-16 px-4 md:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto text-center mb-12 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Choose Your Monitoring Path
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Whether you're an individual tracking personal areas of interest or
            an organization managing multiple assets, select the option that
            fits your needs.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Link to="/register">
              <Card className="h-full border border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg hover:shadow-2xl hover:border-blue-600/50 transition-all duration-300 rounded-2xl relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="text-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/80 text-white mb-4 mx-auto relative z-10"
                  >
                    <User className="w-6 h-6" />
                  </motion.div>
                  <CardTitle className="text-xl font-semibold text-white relative z-10">
                    Monitor AOI as a Regular User
                  </CardTitle>
                  <p className="text-sm text-gray-400 relative z-10">
                    For individuals who want to monitor personal areas of
                    interest with ease and precision.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Link to="/organizational-registration">
              <Card className="h-full border border-gray-700 bg-gray-900/70 backdrop-blur-md shadow-lg hover:shadow-2xl hover:border-blue-600/50 transition-all duration-300 rounded-2xl relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="text-center">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut",
                    }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/80 text-white mb-4 mx-auto relative z-10"
                  >
                    <Building2 className="w-6 h-6" />
                  </motion.div>
                  <CardTitle className="text-xl font-semibold text-white relative z-10">
                    Monitor AOI as an Organization
                  </CardTitle>
                  <p className="text-sm text-gray-400 relative z-10">
                    For businesses like real estate companies to monitor and
                    manage multiple areas of interest at scale.
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default UserTypes;
