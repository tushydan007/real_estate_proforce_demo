"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";

const values = [
  {
    id: 1,
    title: "Innovation",
    description:
      "We push boundaries with cutting-edge space and AI technology.",
  },
  {
    id: 2,
    title: "Integrity",
    description:
      "We uphold transparency and reliability in every solution we deliver.",
  },
  {
    id: 3,
    title: "Impact",
    description:
      "We empower organizations with actionable space-driven insights.",
  },
];

const team = [
  {
    id: 1,
    name: "Engr. Ade Ogundeyin",
    role: "Group Managing Director",
    image: "/assets/team/gmd.jpg",
  },
  {
    id: 2,
    name: "Engr. Bami Ogundeyin",
    role: "Head of Operations",
    image: "/assets/team/hoo.jpg",
  },
  {
    id: 3,
    name: "Engr. Tope Robert",
    role: "CTO",
    image: "/assets/team/managerpga.jpg",
  },
];

const stats = [
  { id: 1, label: "Years of Experience", value: "10+" },
  { id: 2, label: "Global Clients", value: "250+" },
  { id: 3, label: "Countries Covered", value: "50+" },
  { id: 4, label: "Successful Launches", value: "30+" },
];

export default function AboutUs() {
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
    hidden: { opacity: 0, y: 25 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: i * 0.2 },
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
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('./assets/space-bg.jpg')] bg-cover bg-center bg-fixed opacity-40"
          style={{ backgroundAttachment: "fixed" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/75" />
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
            About Proforce Galaxies Limited
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl mb-10 text-gray-200"
            variants={paragraphVariants}
          >
            We revolutionize asset monitoring with advanced satellite technology
            and AI-driven analytics, empowering organizations in agriculture,
            urban planning, and environmental protection with actionable
            insights for a safer, sustainable future.
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
                Learn More
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Our Story */}
      <motion.section
        className="w-full py-24 px-4 md:px-8 lg:px-16 bg-black border-b border-gray-700"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2
            className="text-3xl font-bold mb-6 text-white"
            variants={headingVariants}
          >
            Our Story
          </motion.h2>
          <motion.p
            className="text-gray-200 leading-relaxed"
            variants={paragraphVariants}
          >
            Founded with a vision to bridge the gap between space technology and
            businesses on Earth, we’ve grown into a trusted partner for
            organizations worldwide. Our platform empowers clients to harness
            real-time satellite data, predictive insights, and secure cloud
            integration for smarter decision-making.
          </motion.p>
        </div>
      </motion.section>

      {/* Our Values */}
      <motion.section
        className="w-full pt-16 pb-20 px-4 md:px-8 lg:px-16 bg-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.h2
            className="text-3xl font-bold mb-6 text-gray-200"
            variants={headingVariants}
          >
            Our Values
          </motion.h2>
          <motion.p
            className="text-gray-200 max-w-2xl mx-auto"
            variants={paragraphVariants}
          >
            The principles that guide us in building impactful and reliable
            solutions.
          </motion.p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={value.id}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              className="rounded-xl"
            >
              <Card className="h-full shadow-sm hover:shadow-md transition-shadow rounded-xl bg-[#0C111C] border border-gray-600 py-12">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-200 text-center">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-200 text-center">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Meet the Team */}
      <motion.section
        className="w-full py-16 px-4 md:px-8 lg:px-16 border-b border-gray-700 bg-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ delay: 0.3 }}
      >
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.h2
            className="text-3xl font-bold mb-6 text-white"
            variants={headingVariants}
          >
            Meet the Team
          </motion.h2>
          <motion.p
            className="text-gray-200 max-w-2xl mx-auto"
            variants={paragraphVariants}
          >
            A passionate team of experts dedicated to transforming how the world
            monitors and manages assets from space.
          </motion.p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              className="flex flex-col items-center text-center rounded-lg cursor-pointer"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-40 h-40 rounded-full object-cover mb-4 border-2 border-primary/20"
              />
              <h3 className="text-lg font-semibold text-white">
                {member.name}
              </h3>
              <p className="text-gray-500">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Why Choose Us */}
      <motion.section
        className="w-full py-20 px-4 md:px-8 lg:px-16 bg-black"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
        transition={{ delay: 0.4 }}
      >
        <div className="max-w-6xl mx-auto text-center mb-12">
          <motion.h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-200"
            variants={headingVariants}
          >
            Why Choose Us?
          </motion.h2>
          <motion.p
            className="text-gray-200 max-w-2xl mx-auto"
            variants={paragraphVariants}
          >
            Trusted by clients worldwide, we deliver reliability, accuracy, and
            innovation that set us apart.
          </motion.p>
        </div>

        {/* Stats */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              className="text-center"
            >
              <p className="text-4xl font-extrabold text-gray-200">
                {stat.value}
              </p>
              <p className="text-gray-200 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
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
              Join Our Journey
            </Button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
