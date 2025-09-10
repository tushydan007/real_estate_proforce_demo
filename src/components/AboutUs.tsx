"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
    role: "CEO & Founder",
    image: "/assets/team/gmd.jpg", // place your images in public/assets/team
  },
  {
    id: 2,
    name: "Engr. Temitope Robert",
    role: "CTO",
    image: "/assets/team/john.jpg",
  },
  {
    id: 3,
    name: "Ayobami Ogundeyin",
    role: "Head of Product",
    image: "/assets/team/hoo.jpg",
  },
];

const stats = [
  { id: 1, label: "Years of Experience", value: "10+" },
  { id: 2, label: "Global Clients", value: "250+" },
  { id: 3, label: "Countries Covered", value: "50+" },
  { id: 4, label: "Successful Launches", value: "30+" },
];

export default function AboutUs() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full py-20 px-4 md:px-8 lg:px-16 bg-black text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white"
        >
          About Us
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg text-gray-200 max-w-2xl mx-auto"
        >
          We are on a mission to revolutionize asset monitoring using satellite
          technology, delivering insights that matter from space to your
          business.
        </motion.p>
      </section>

      {/* Our Story */}
      <section className="w-full py-16 px-4 md:px-8 lg:px-16 bg-black border-b border-gray-700">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Our Story</h2>
          <p className="text-gray-200 leading-relaxed">
            Founded with a vision to bridge the gap between space technology and
            businesses on Earth, we’ve grown into a trusted partner for
            organizations worldwide. Our platform empowers clients to harness
            real-time satellite data, predictive insights, and secure cloud
            integration for smarter decision-making.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="w-full pt-16 pb-20 px-4 md:px-8 lg:px-16 bg-black">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-6 text-gray-200">Our Values</h2>
          <p className="text-gray-200 max-w-2xl mx-auto">
            The principles that guide us in building impactful and reliable
            solutions.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={value.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
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
      </section>

      {/* Meet the Team */}
      <section className="w-full py-16 px-4 md:px-8 lg:px-16  border-b border-gray-700 bg-black">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-6 text-black">Meet the Team</h2>
          <p className="text-gray-200 max-w-2xl mx-auto">
            A passionate team of experts dedicated to transforming how the world
            monitors and manages assets from space.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center rounded-lg coursor-pointer"
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
      </section>

      {/* Why Choose Us */}
      <section className="w-full py-20 px-4 md:px-8 lg:px-16 bg-black">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-200">
            Why Choose Us?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Trusted by clients worldwide, we deliver reliability, accuracy, and
            innovation that set us apart.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              viewport={{ once: true }}
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
          <Button
            size="lg"
            className="rounded-full cursor-pointer px-8 py-6 text-base text-black bg-white hover:bg-white/80 shadow-md"
          >
            Join Our Journey
          </Button>
        </div>
      </section>
    </div>
  );
}
