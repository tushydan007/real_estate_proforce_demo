import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Monitoring = () => {
  return (
    <section
      id="plans"
      className="relative w-full py-20 px-4 md:px-8 lg:px-16 bg-black/70 backdrop-blur-sm text-white text-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
        Start Monitoring Today
      </h2>
      <p className="mb-8 text-lg text-gray-300 max-w-2xl mx-auto">
        Enjoy a 7-day free trial, then upgrade to unlock premium features.
      </p>
      <Link to="/subscription">
        <Button size="lg" className="cursor-pointer rounded-full px-8 py-6 text-base shadow-md bg-white hover:bg-white/80 text-black transition-colors">
          View Plans
        </Button>
      </Link>
    </section>
  );
};

export default Monitoring;
