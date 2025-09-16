import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useRef, useEffect, useState } from "react";
import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";

const Hero = () => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 0 });
  const [texturesLoaded, setTexturesLoaded] = useState(false);

  useEffect(() => {
    const preloadImages = async () => {
      const images = [
        "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
        "//unpkg.com/three-globe/example/img/earth-topology.png",
      ];
      const promises = images.map((src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
          img.onerror = reject;
        });
      });
      await Promise.all(promises);
      setTexturesLoaded(true);
    };
    preloadImages();
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setGlobeSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const offsetX = (e.clientX / innerWidth - 0.5) * 20;
      const offsetY = (e.clientY / innerHeight - 0.5) * 20;
      setParallax({ x: offsetX, y: offsetY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (globeRef.current && texturesLoaded) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.9;
    }
  }, [texturesLoaded]);

  return (
    <section className="relative flex flex-col-reverse md:flex-row items-center justify-between px-6 py-16 w-full mx-auto h-[calc(100vh-4rem)] md:px-8 text-white z-0 overflow-hidden">
      {/* Rotating Galaxy Background */}
      <motion.div
        className="absolute inset-0 -z-20 animate-spin-slow"
        style={{
          backgroundImage: `url("https://www.solarsystemscope.com/textures/download/8k_stars_milky_way.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
        }}
      />

      {/* Animated Twinkling Stars */}
      <div className="absolute inset-0 -z-10">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white rounded-full"
            initial={{
              opacity: Math.random(),
              x: Math.random() * window.innerWidth * 0.8,
              y: Math.random() * window.innerHeight * 0.8,
            }}
            animate={{
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl text-center md:text-left relative z-10 md:w-1/2 mx-auto"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Monitor Your Assets from Space
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          Harness cutting-edge satellite data and geospatial technology to
          monitor, analyze, and protect your assets in real time.
        </p>
        <Link to="/register">
          <Button
            size="lg"
            className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Start Free Trial
          </Button>
        </Link>
      </motion.div>

      {/* Globe */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full md:w-1/2 h-64 sm:h-72 md:h-80 lg:h-[620px] flex items-center justify-center relative z-10"
        style={{ backgroundColor: "transparent" }}
      >
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "transparent" }}
        >
          {texturesLoaded ? (
            <Globe
              ref={globeRef}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              width={globeSize.width}
              height={globeSize.height}
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;

// SECOND OPTION
// import { motion } from "framer-motion";
// import { Link } from "react-router-dom";
// import { Button } from "./ui/button";
// import Globe from "react-globe.gl";
// import { useRef, useEffect, useState } from "react";
// import type { GlobeMethods } from "react-globe.gl";

// const Hero = () => {
//   const globeRef = useRef<GlobeMethods | undefined>(undefined);

//   // Track mouse for parallax effect
//   const [parallax, setParallax] = useState({ x: 0, y: 0 });

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       const { innerWidth, innerHeight } = window;
//       const offsetX = (e.clientX / innerWidth - 0.5) * 20; // range -10 to +10
//       const offsetY = (e.clientY / innerHeight - 0.5) * 20;
//       setParallax({ x: offsetX, y: offsetY });
//     };

//     window.addEventListener("mousemove", handleMouseMove);
//     return () => window.removeEventListener("mousemove", handleMouseMove);
//   }, []);

//   // Rotate globe continuously
//   useEffect(() => {
//     if (globeRef.current) {
//       globeRef.current.controls().autoRotate = true;
//       globeRef.current.controls().autoRotateSpeed = 0.8; // slow rotation
//     }
//   }, []);

//   return (
//     <section className="relative flex flex-col-reverse md:flex-row items-center justify-between px-6 py-16 w-full mx-auto h-[calc(100vh-4rem)] md:px-8 overflow-hidden text-white">
//       {/* Rotating Galaxy Background */}
//       <motion.div
//         className="absolute inset-0 -z-20 animate-spin-slow"
//         style={{
//           backgroundImage: `url("https://www.solarsystemscope.com/textures/download/8k_stars_milky_way.jpg")`,
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           transform: `translate(${parallax.x}px, ${parallax.y}px)`,
//         }}
//       />

//       {/* Animated Twinkling Stars */}
//       <div className="absolute inset-0 -z-10 overflow-hidden">
//         {Array.from({ length: 120 }).map((_, i) => (
//           <motion.div
//             key={i}
//             className="absolute w-[2px] h-[2px] bg-white rounded-full"
//             initial={{
//               opacity: Math.random(),
//               x: Math.random() * window.innerWidth,
//               y: Math.random() * window.innerHeight,
//             }}
//             animate={{
//               opacity: [0, 1, 0],
//             }}
//             transition={{
//               duration: Math.random() * 4 + 3,
//               repeat: Infinity,
//               ease: "easeInOut",
//               delay: Math.random() * 5,
//             }}
//           />
//         ))}
//       </div>

//       {/* Text */}

//       <motion.div
//         initial={{ opacity: 0, x: -40 }}
//         animate={{ opacity: 1, x: 0 }}
//         transition={{ duration: 0.8 }}
//         className="max-w-2xl text-center md:text-left relative z-10 md:w-1/2 mx-auto"
//       >
//         <h1 className="text-4xl md:text-6xl font-bold mb-6">
//           Monitor Your Assets from Space
//         </h1>
//         <p className="text-lg text-gray-300 mb-6">
//           Harness cutting-edge satellite data and geospatial technology to
//           monitor, analyze, and protect your assets in real time.
//         </p>
//         <Link to="/register">
//           <Button
//             size="lg"
//             className="cursor-pointer bg-white text-black hover:bg-gray-200"
//           >
//             Start Free Trial
//           </Button>
//         </Link>
//       </motion.div>

//       {/* Globe */}
//       <motion.div
//         initial={{ opacity: 0, scale: 0.8 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 1 }}
//         className="w-full md:w-1/2 hidden h-64 sm:h-72 md:h-80 lg:h-[620px] md:flex items-center justify-center relative z-10 bg-black"
//       >
//         <div className="w-full h-full flex items-center justify-center">
//           <Globe
//             ref={globeRef}
//             globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
//             bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
//             backgroundColor="rgba(0,0,0,0)"
//             width={undefined}
//             height={undefined}
//           />
//         </div>
//       </motion.div>
//     </section>
//   );
// };

// export default Hero;
