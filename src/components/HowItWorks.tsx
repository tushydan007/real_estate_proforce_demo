import { motion } from "framer-motion";

const data = [
  "Sign up and start your free trial.",
  "Select your assets & regions of interest.",
  "Receive satellite-driven insights in your dashboard.",
];

const HowItWorks = () => {
  return (
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
              className="bg-blue-50 p-6 rounded-2xl shadow-sm text-center"
            >
              <span className="block text-4xl font-bold text-blue-600 mb-4 font-[kavoon]">
                {idx + 1}
              </span>
              <p className="text-gray-700 font-[kavoon]">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
