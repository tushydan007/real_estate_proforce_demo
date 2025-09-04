import { motion } from "framer-motion";

const Features = () => {
  return (
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
              className="bg-white p-6 rounded-2xl shadow-lg font-[kavoon]"
            >
              <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
