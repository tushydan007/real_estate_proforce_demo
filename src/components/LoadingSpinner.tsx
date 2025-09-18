import { motion } from "framer-motion";

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="relative flex flex-col items-center">
        {/* Outer rotating ring */}
        <motion.div
          className="w-16 h-16 border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner pulsing dot */}
        {/* <motion.div
          className="absolute w-4 h-4 bg-blue-400 rounded-full"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        /> */}
        {/* Loading text with fade animation */}
        <motion.div
          className="mt-6 text-lg font-medium bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text font-['kavoon']"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          Loading Dashboard...
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
