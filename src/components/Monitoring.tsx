import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Monitoring = () => {
  return (
    <section
      id="plans"
      className="relative w-full py-20 px-4 md:px-8 lg:px-16 bg-black/70 backdrop-blur-sm text-white text-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-12">
        Start Monitoring Today
      </h2>

      <Link to="/register">
        <Button
          size="lg"
          className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
        >
          Explore
        </Button>
      </Link>
    </section>
  );
};

export default Monitoring;
