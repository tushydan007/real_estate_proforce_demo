import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";


const Monitoring = () => {
  return (
    <section
      id="plans"
      className="bg-blue-600 py-16 px-6 text-white text-center mt-20 mb-36"
    >
      <h2 className="text-3xl font-bold mb-6">Start Monitoring Today</h2>
      <p className="mb-8 text-lg">
        Enjoy a 7-day free trial, then upgrade to unlock premium features.
      </p>
      <Link to="/subscription">
        <Button size="lg" variant="secondary">
          View Plans
        </Button>
      </Link>
    </section>
  );
};

export default Monitoring;
