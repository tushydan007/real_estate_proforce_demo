import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const Careers = () => {
  // Define section variants with explicit Variants type
  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  // Define item variants for staggered animations
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: i * 0.1 },
    }),
  };

  // Define heading variants
  const headingVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Define paragraph variants
  const paragraphVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Define button variants
  const buttonVariants: Variants = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('./assets/careers-hero.jpg')] bg-cover bg-center bg-fixed opacity-40"
          style={{ backgroundAttachment: "fixed" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
        <motion.div
          className="relative z-10 text-center px-6 md:px-8 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <motion.h1
            className="text-3xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
            variants={headingVariants}
          >
            Join Proforce Galaxies Limited
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl mb-10 text-gray-200"
            variants={paragraphVariants}
          >
            Pioneering Geospatial Monitoring to Protect Our World
          </motion.p>
          <Link to="#open-positions">
            <motion.div
              variants={buttonVariants}
              initial="rest"
              animate="animate"
              whileHover="hover"
            >
              <Button
                size="lg"
                className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform transition-all duration-300 shadow-lg"
              >
                Explore Open Positions
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Our Culture Section */}
        <motion.section
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
        >
          <motion.h2
            className="text-3xl font-bold mb-6 text-center"
            variants={headingVariants}
          >
            Our Culture
          </motion.h2>
          <motion.p
            className="text-lg mb-8 text-center"
            variants={paragraphVariants}
          >
            We foster a collaborative, innovative, and inclusive environment
            where every team member can thrive.
          </motion.p>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                value: "item-1",
                trigger: "No Egos in Orbit",
                content:
                  "We value humility, curiosity, and teamwork. Our culture encourages continuous learning and supporting one another to achieve stellar results.",
              },
              {
                value: "item-2",
                trigger: "Growth at Warp Speed",
                content:
                  "In the fast-paced world of geospatial tech, we embrace experimentation, quick iterations, and learning from failures to propel our growth.",
              },
              {
                value: "item-3",
                trigger: "Every Star Matters",
                content:
                  "Diversity and inclusion are at our core. Our global team celebrates unique perspectives and ensures everyone feels valued and empowered.",
              },
              {
                value: "item-4",
                trigger: "Core Values",
                content: (
                  <ul className="list-disc pl-6">
                    <li>
                      <strong>Innovative:</strong> Pushing boundaries with
                      cutting-edge technology.
                    </li>
                    <li>
                      <strong>Integrity:</strong> Committed to ethical practices
                      and transparency.
                    </li>
                    <li>
                      <strong>Impactful:</strong> Focused on solutions that make a
                      real difference.
                    </li>
                    <li>
                      <strong>Resilient:</strong> Adapting to challenges in an
                      ever-changing landscape.
                    </li>
                  </ul>
                ),
              },
            ].map((item, index) => (
              <motion.div
                key={item.value}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
              >
                <AccordionItem value={item.value}>
                  <AccordionTrigger>{item.trigger}</AccordionTrigger>
                  <AccordionContent>{item.content}</AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.section>

        <motion.div
          className="my-12 bg-gray-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Separator className="bg-gray-700" />
        </motion.div>

        {/* Benefits Section */}
        <motion.section
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-6 text-center"
            variants={headingVariants}
          >
            Benefits & Perks
          </motion.h2>
          <motion.p
            className="text-lg mb-8 text-center"
            variants={paragraphVariants}
          >
            We offer comprehensive benefits to support your professional and
            personal well-being.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Competitive Compensation",
                description:
                  "Attractive salaries, performance bonuses, and equity options to reward your contributions.",
              },
              {
                title: "Health & Wellness",
                description:
                  "Comprehensive medical, dental, and vision coverage, plus wellness programs and gym memberships.",
              },
              {
                title: "Flexible Work",
                description:
                  "Remote-first options, flexible hours, and unlimited PTO to maintain work-life balance.",
              },
              {
                title: "Professional Development",
                description:
                  "Learning stipends, conferences, and mentorship programs to fuel your career growth.",
              },
              {
                title: "Team Building",
                description:
                  "Virtual and in-person events, team retreats, and fun activities to strengthen bonds.",
              },
              {
                title: "Additional Perks",
                description:
                  "Parental leave, 401(k) matching, and employee assistance programs.",
              },
            ].map((benefit, index) => (
              <motion.div
                key={benefit.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
              >
                <Card className="bg-gray-800 border-none">
                  <CardHeader>
                    <CardTitle className="text-gray-200">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.div
          className="my-12 bg-gray-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Separator className="bg-gray-700" />
        </motion.div>

        {/* Open Positions Section */}
        <motion.section
          className="mb-16"
          id="open-positions"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          transition={{ delay: 0.3 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-6 text-center"
            variants={headingVariants}
          >
            Open Positions
          </motion.h2>
          <motion.p
            className="text-lg mb-8 text-center"
            variants={paragraphVariants}
          >
            We're always looking for talented individuals to join our mission.
            Check out our current openings.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Frontend Developer",
                location: "Remote",
                description:
                  "Build intuitive user interfaces for our geospatial platform using React, Tailwind, and ShadCN.",
                requirements: [
                  "3+ years experience in frontend development",
                  "Proficiency in TypeScript and modern JS frameworks",
                  "Passion for UI/UX design",
                ],
              },
              {
                title: "GIS Analyst",
                location: "Lagos, Nigeria",
                description:
                  "Analyze geospatial data and develop monitoring algorithms for AOI encroachment detection.",
                requirements: [
                  "Bachelor's in GIS or related field",
                  "Experience with ArcGIS, QGIS, or similar tools",
                  "Knowledge of satellite imagery processing",
                ],
              },
              {
                title: "Data Scientist",
                location: "Remote",
                description:
                  "Develop AI models for predictive analytics in geospatial monitoring.",
                requirements: [
                  "Advanced degree in Data Science or ML",
                  "Proficiency in Python, TensorFlow/PyTorch",
                  "Experience with big data technologies",
                ],
              },
              {
                title: "Product Manager",
                location: "Remote",
                description:
                  "Lead product development for our AOI monitoring features, from ideation to launch.",
                requirements: [
                  "5+ years in product management",
                  "Experience in tech/SaaS products",
                  "Strong analytical and communication skills",
                ],
              },
            ].map((job, index) => (
              <motion.div
                key={job.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
              >
                <Card className="bg-gray-800 border-none">
                  <CardHeader>
                    <CardTitle className="text-white mb-6">{job.title}</CardTitle>
                    <CardDescription className="text-gray-300">
                      {job.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{job.description}</p>
                    <ul className="list-disc pl-6 text-gray-300">
                      {job.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <motion.div
                      variants={buttonVariants}
                      initial="rest"
                      whileHover="hover"
                      animate="animate"
                    >
                      <Button variant="outline" className="w-full cursor-pointer">
                        Apply Now
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.div
          className="my-12 bg-gray-700"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Separator className="bg-gray-700" />
        </motion.div>

        {/* How to Apply Section */}
        <motion.section
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          transition={{ delay: 0.4 }}
        >
          <motion.h2
            className="text-3xl font-bold mb-6 text-center"
            variants={headingVariants}
          >
            How to Apply
          </motion.h2>
          <motion.p
            className="text-lg mb-8 text-center"
            variants={paragraphVariants}
          >
            Interested in joining our team? Send your resume and a cover letter
            explaining why you're a great fit for Proforce Galaxies Limited to
            careers@proforcegalaxies.com. We review applications on a rolling
            basis and will get back to you soon.
          </motion.p>
          <div className="flex justify-center">
            <Link to="/contact-us">
              <motion.div
                variants={buttonVariants}
                initial="rest"
                animate="animate"
                whileHover="hover"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform transition-all duration-300 shadow-lg"
                >
                  Contact Us
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Careers;

// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from "@/components/ui/accordion";
// import { Separator } from "@/components/ui/separator";
// import { Link } from "react-router";

// const Careers = () => {
//   return (
//     <div className="min-h-screen bg-black text-white">
//       {/* Hero Section */}
//       <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
//         <div
//           className="absolute inset-0 bg-[url('./assets/careers-hero.jpg')] bg-cover bg-center bg-fixed opacity-40 transition-opacity duration-1000"
//           style={{ backgroundAttachment: "fixed" }}
//         />
//         <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
//         <div className="relative z-10 text-center px-6 md:px-8 max-w-4xl mx-auto">
//           <h1 className="text-3xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 animate-fade-in-down">
//             Join Proforce Galaxies Limited
//           </h1>
//           <p className="text-lg md:text-2xl mb-10 text-gray-200 animate-fade-in-up delay-200">
//             Pioneering Geospatial Monitoring to Protect Our World
//           </p>
//           <Link to="#open-positions">
//             <Button
//               size="lg"
//               className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
//             >
//               Explore Open Positions
//             </Button>
//           </Link>
//         </div>
//       </section>

//       <div className="container mx-auto px-4 py-16">
//         {/* Our Culture Section */}
//         <section className="mb-16">
//           <h2 className="text-3xl font-bold mb-6 text-center">Our Culture</h2>
//           <p className="text-lg mb-8 text-center">
//             We foster a collaborative, innovative, and inclusive environment
//             where every team member can thrive.
//           </p>
//           <Accordion type="single" collapsible className="w-full">
//             <AccordionItem value="item-1">
//               <AccordionTrigger>No Egos in Orbit</AccordionTrigger>
//               <AccordionContent>
//                 We value humility, curiosity, and teamwork. Our culture
//                 encourages continuous learning and supporting one another to
//                 achieve stellar results.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-2">
//               <AccordionTrigger>Growth at Warp Speed</AccordionTrigger>
//               <AccordionContent>
//                 In the fast-paced world of geospatial tech, we embrace
//                 experimentation, quick iterations, and learning from failures to
//                 propel our growth.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-3">
//               <AccordionTrigger>Every Star Matters</AccordionTrigger>
//               <AccordionContent>
//                 Diversity and inclusion are at our core. Our global team
//                 celebrates unique perspectives and ensures everyone feels valued
//                 and empowered.
//               </AccordionContent>
//             </AccordionItem>
//             <AccordionItem value="item-4">
//               <AccordionTrigger>Core Values</AccordionTrigger>
//               <AccordionContent>
//                 <ul className="list-disc pl-6">
//                   <li>
//                     <strong>Innovative:</strong> Pushing boundaries with
//                     cutting-edge technology.
//                   </li>
//                   <li>
//                     <strong>Integrity:</strong> Committed to ethical practices
//                     and transparency.
//                   </li>
//                   <li>
//                     <strong>Impactful:</strong> Focused on solutions that make a
//                     real difference.
//                   </li>
//                   <li>
//                     <strong>Resilient:</strong> Adapting to challenges in an
//                     ever-changing landscape.
//                   </li>
//                 </ul>
//               </AccordionContent>
//             </AccordionItem>
//           </Accordion>
//         </section>

//         <Separator className="my-12 bg-gray-700" />

//         {/* Benefits Section */}
//         <section className="mb-16">
//           <h2 className="text-3xl font-bold mb-6 text-center">
//             Benefits & Perks
//           </h2>
//           <p className="text-lg mb-8 text-center">
//             We offer comprehensive benefits to support your professional and
//             personal well-being.
//           </p>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-gray-200">
//                   Competitive Compensation
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-gray-300">
//                   Attractive salaries, performance bonuses, and equity options
//                   to reward your contributions.
//                 </CardDescription>
//               </CardContent>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-gray-200">
//                   Health & Wellness
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-gray-300">
//                   Comprehensive medical, dental, and vision coverage, plus
//                   wellness programs and gym memberships.
//                 </CardDescription>
//               </CardContent>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-gray-200">Flexible Work</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-gray-300">
//                   Remote-first options, flexible hours, and unlimited PTO to
//                   maintain work-life balance.
//                 </CardDescription>
//               </CardContent>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-gray-200">
//                   Professional Development
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-gray-300">
//                   Learning stipends, conferences, and mentorship programs to
//                   fuel your career growth.
//                 </CardDescription>
//               </CardContent>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-gray-200">Team Building</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-gray-300">
//                   Virtual and in-person events, team retreats, and fun
//                   activities to strengthen bonds.
//                 </CardDescription>
//               </CardContent>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-gray-200">
//                   Additional Perks
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-gray-300">
//                   Parental leave, 401(k) matching, and employee assistance
//                   programs.
//                 </CardDescription>
//               </CardContent>
//             </Card>
//           </div>
//         </section>

//         <Separator className="my-12 bg-gray-700" />

//         {/* Open Positions Section */}
//         <section className="mb-16" id="open-positions">
//           <h2 className="text-3xl font-bold mb-6 text-center">
//             Open Positions
//           </h2>
//           <p className="text-lg mb-8 text-center">
//             We're always looking for talented individuals to join our mission.
//             Check out our current openings.
//           </p>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-white mb-6">
//                   Frontend Developer
//                 </CardTitle>
//                 <CardDescription className="text-gray-300">
//                   Remote
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-gray-300 mb-4">
//                   Build intuitive user interfaces for our geospatial platform
//                   using React, Tailwind, and ShadCN.
//                 </p>
//                 <ul className="list-disc pl-6 text-gray-300">
//                   <li>3+ years experience in frontend development</li>
//                   <li>Proficiency in TypeScript and modern JS frameworks</li>
//                   <li>Passion for UI/UX design</li>
//                 </ul>
//               </CardContent>
//               <CardFooter>
//                 <Button variant="outline" className="w-full cursor-pointer">
//                   Apply Now
//                 </Button>
//               </CardFooter>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-white mb-6">GIS Analyst</CardTitle>
//                 <CardDescription className="text-gray-300">
//                   Lagos, Nigeria
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-gray-300 mb-4">
//                   Analyze geospatial data and develop monitoring algorithms for
//                   AOI encroachment detection.
//                 </p>
//                 <ul className="list-disc pl-6 text-gray-300">
//                   <li>Bachelor's in GIS or related field</li>
//                   <li>Experience with ArcGIS, QGIS, or similar tools</li>
//                   <li>Knowledge of satellite imagery processing</li>
//                 </ul>
//               </CardContent>
//               <CardFooter>
//                 <Button variant="outline" className="w-full cursor-pointer">
//                   Apply Now
//                 </Button>
//               </CardFooter>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-white mb-6">
//                   Data Scientist
//                 </CardTitle>
//                 <CardDescription className="text-gray-300">
//                   Remote
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-gray-300 mb-4">
//                   Develop AI models for predictive analytics in geospatial
//                   monitoring.
//                 </p>
//                 <ul className="list-disc pl-6 text-gray-300">
//                   <li>Advanced degree in Data Science or ML</li>
//                   <li>Proficiency in Python, TensorFlow/PyTorch</li>
//                   <li>Experience with big data technologies</li>
//                 </ul>
//               </CardContent>
//               <CardFooter>
//                 <Button variant="outline" className="w-full cursor-pointer">
//                   Apply Now
//                 </Button>
//               </CardFooter>
//             </Card>
//             <Card className="bg-gray-800 border-none">
//               <CardHeader>
//                 <CardTitle className="text-white mb-6">
//                   Product Manager
//                 </CardTitle>
//                 <CardDescription className="text-gray-300">
//                   Remote
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-gray-300 mb-4">
//                   Lead product development for our AOI monitoring features, from
//                   ideation to launch.
//                 </p>
//                 <ul className="list-disc pl-6 text-gray-300">
//                   <li>5+ years in product management</li>
//                   <li>Experience in tech/SaaS products</li>
//                   <li>Strong analytical and communication skills</li>
//                 </ul>
//               </CardContent>
//               <CardFooter>
//                 <Button variant="outline" className="w-full cursor-pointer">
//                   Apply Now
//                 </Button>
//               </CardFooter>
//             </Card>
//           </div>
//         </section>

//         <Separator className="my-12 bg-gray-700" />

//         {/* How to Apply Section */}
//         <section className="mb-16">
//           <h2 className="text-3xl font-bold mb-6 text-center">How to Apply</h2>
//           <p className="text-lg mb-8 text-center">
//             Interested in joining our team? Send your resume and a cover letter
//             explaining why you're a great fit for Proforce Galaxies Limited to
//             careers@proforcegalaxies.com. We review applications on a rolling
//             basis and will get back to you soon.
//           </p>
//           <div className="flex justify-center">
//             <Link to="/contact-us">
//               <Button
//                 size="lg"
//                 className="bg-gradient-to-r cursor-pointer from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
//               >
//                 Contact Us
//               </Button>
//             </Link>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default Careers;
