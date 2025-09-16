import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// Fix Leaflet marker issue
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactUs: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Replace with API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      console.log(data);
      toast.success("Message sent successfully 🎉");
      reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    }
  };

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
      scale: [1, 1.02, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <div className="min-h-screen text-white flex flex-col bg-black">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('./assets/customer-care.jpg')] bg-cover bg-center bg-fixed opacity-40"
          style={{ backgroundAttachment: "fixed" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
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
            Contact Us
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl mb-10 text-gray-200"
            variants={paragraphVariants}
          >
            We'd love to hear from you. Reach out anytime!
          </motion.p>
          <Link to="#contact-form">
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
                Get In Touch
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Contact Info + Form */}
      <motion.div
        className="flex flex-col lg:flex-row gap-10 px-6 lg:px-20 md:py-32 py-16 bg-[#0C111C]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={sectionVariants}
      >
        {/* Left: Contact Info */}
        <div className="lg:w-1/2 space-y-8">
          <motion.h2
            className="text-2xl font-semibold text-gray-200"
            variants={headingVariants}
          >
            Our Office
          </motion.h2>
          <motion.p
            className="text-gray-200"
            variants={paragraphVariants}
          >
            Visit us at our office or connect with us through email or phone.
          </motion.p>
          <div className="space-y-4 text-gray-200">
            {[
              {
                icon: <MapPin className="backdrop-blur-sm w-6 h-6" />,
                text: (
                  <>
                    1 Akaka Junction, Ode Remo,
                    <br /> Ogun State, Nigeria
                  </>
                ),
              },
              {
                icon: <Phone className="backdrop-blur-sm w-6 h-6" />,
                text: "+234 800 123 4567",
              },
              {
                icon: <Mail className="backdrop-blur-sm w-6 h-6" />,
                text: "support@proforcegalaxies.com",
              },
              {
                icon: <Clock className="backdrop-blur-sm w-6 h-6" />,
                text: "Mon - Sat: 9:00 AM - 6:00 PM",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
                className="flex items-start gap-3"
              >
                {item.icon}
                <p>{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Map */}
          <motion.div
            className="h-96 w-full rounded-lg overflow-hidden shadow"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={itemVariants}
            custom={4} // Delay after contact info items
          >
            <MapContainer
              center={[6.97335, 3.68557]}
              zoom={15}
              scrollWheelZoom={false}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[6.97335, 3.68557]} icon={markerIcon}>
                <Popup>Our Office Location</Popup>
              </Marker>
            </MapContainer>
          </motion.div>
        </div>

        {/* Right: Contact Form */}
        <motion.div
          id="contact-form"
          className="lg:w-1/2 bg-[#0C111C] text-gray-200 shadow-lg rounded-lg p-6 space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          transition={{ delay: 0.2 }}
        >
          <motion.h2
            className="text-2xl font-semibold"
            variants={headingVariants}
          >
            Send us a message
          </motion.h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              {
                label: "Name",
                name: "name",
                type: "text",
                placeholder: "Your name",
              },
              {
                label: "Email",
                name: "email",
                type: "email",
                placeholder: "you@example.com",
              },
              {
                label: "Message",
                name: "message",
                type: "textarea",
                placeholder: "Your message...",
              },
            ].map((field, index) => (
              <motion.div
                key={field.name}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={itemVariants}
              >
                <label className="block text-sm font-medium">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={5}
                    {...register(field.name as keyof ContactFormData)}
                    placeholder={field.placeholder}
                    className="w-full mt-1 border border-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  ></textarea>
                ) : (
                  <input
                    type={field.type}
                    {...register(field.name as keyof ContactFormData)}
                    placeholder={field.placeholder}
                    className="w-full mt-1 border border-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                )}
                {errors[field.name as keyof ContactFormData] && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors[field.name as keyof ContactFormData]?.message}
                  </p>
                )}
              </motion.div>
            ))}
            <motion.div
              variants={buttonVariants}
              initial="rest"
              animate="animate"
              whileHover="hover"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center cursor-pointer gap-2 w-full bg-white backdrop-blur-sm text-black py-3 rounded-lg font-semibold hover:bg-white/80 transition disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Send Message
                  </>
                )}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContactUs;










// import { useForm } from "react-hook-form";
// import { z } from "zod";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
// import toast from "react-hot-toast";
// import { Button } from "@/components/ui/button";
// import { Link } from "react-router-dom";

// // Fix Leaflet marker issue
// const markerIcon = new L.Icon({
//   iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });

// // Validation schema
// const contactSchema = z.object({
//   name: z.string().min(2, "Name must be at least 2 characters"),
//   email: z.string().email("Please enter a valid email"),
//   message: z.string().min(10, "Message must be at least 10 characters"),
// });

// type ContactFormData = z.infer<typeof contactSchema>;

// const ContactUs = () => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//   } = useForm<ContactFormData>({
//     resolver: zodResolver(contactSchema),
//   });

//   const onSubmit = async (data: ContactFormData) => {
//     try {
//       // Replace with API call
//       await new Promise((resolve) => setTimeout(resolve, 1200));
//       console.log(data);
//       toast.success("Message sent successfully 🎉");
//       reset();
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : "Something went wrong";
//       toast.error(message);
//     }
//   };

//   return (
//     <div className="min-h-screen text-white flex flex-col bg-black">
//       {/* Hero Section */}
//       <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
//         <div
//           className="absolute inset-0 bg-[url('./assets/customer-care.jpg')] bg-cover bg-center bg-fixed opacity-40 transition-opacity duration-1000"
//           style={{ backgroundAttachment: "fixed" }}
//         />
//         <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
//         <div className="relative z-10 text-center px-6 md:px-8 max-w-4xl mx-auto">
//           <h1 className="text-3xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 animate-fade-in-down">
//             Contact Us
//           </h1>
//           <p className="text-lg md:text-2xl mb-10 text-gray-200 animate-fade-in-up delay-200">
//             We'd love to hear from you. Reach out anytime!
//           </p>
//           <Link to="#contact-form">
//             <Button
//               size="lg"
//               className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-lg"
//             >
//               Get In Touch
//             </Button>
//           </Link>
//         </div>
//       </section>

//       {/* Contact Info + Form */}
//       <div className="flex flex-col lg:flex-row gap-10 px-6 lg:px-20 md:py-32 py-16 bg-[#0C111C]">
//         {/* Left: Contact Info */}
//         <div className="lg:w-1/2 space-y-8">
//           <h2 className="text-2xl font-semibold text-gray-200">Our Office</h2>
//           <p className="text-gray-200">
//             Visit us at our office or connect with us through email or phone.
//           </p>
//           <div className="space-y-4 text-gray-200">
//             <div className="flex items-start gap-3">
//               <MapPin className="backdrop-blur-sm w-6 h-6" />
//               <p>
//                 1 Akaka Junction, Ode Remo,
//                 <br /> Ogun State, Nigeria
//               </p>
//             </div>
//             <div className="flex items-center gap-3">
//               <Phone className="backdrop-blur-sm w-6 h-6" />
//               <p>+234 800 123 4567</p>
//             </div>
//             <div className="flex items-center gap-3">
//               <Mail className="backdrop-blur-sm w-6 h-6" />
//               <p>support@proforcegalaxies.com</p>
//             </div>
//             <div className="flex items-center gap-3">
//               <Clock className="backdrop-blur-sm w-6 h-6" />
//               <p>Mon - Sat: 9:00 AM - 6:00 PM</p>
//             </div>
//           </div>

//           {/* Map */}
//           <div className="h-96 w-full rounded-lg overflow-hidden shadow">
//             <MapContainer
//               center={[6.97335, 3.68557]}
//               zoom={15}
//               scrollWheelZoom={false}
//               className="h-full w-full"
//             >
//               <TileLayer
//                 attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               />
//               <Marker position={[6.97335, 3.68557]} icon={markerIcon}>
//                 <Popup>Our Office Location</Popup>
//               </Marker>
//             </MapContainer>
//           </div>
//         </div>

//         {/* Right: Contact Form */}
//         <div
//           id="contact-form"
//           className="lg:w-1/2 bg-[#0C111C] text-gray-200 shadow-lg rounded-lg p-6 space-y-6"
//         >
//           <h2 className="text-2xl font-semibold">Send us a message</h2>
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium">Name</label>
//               <input
//                 type="text"
//                 {...register("name")}
//                 placeholder="Your name"
//                 className="w-full mt-1 border border-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
//               />
//               {errors.name && (
//                 <p className="text-sm text-red-600 mt-1">
//                   {errors.name.message}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium">Email</label>
//               <input
//                 type="email"
//                 {...register("email")}
//                 placeholder="you@example.com"
//                 className="w-full mt-1 border border-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
//               />
//               {errors.email && (
//                 <p className="text-sm text-red-600 mt-1">
//                   {errors.email.message}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium">Message</label>
//               <textarea
//                 rows={5}
//                 {...register("message")}
//                 placeholder="Your message..."
//                 className="w-full mt-1 border border-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-300"
//               ></textarea>
//               {errors.message && (
//                 <p className="text-sm text-red-600 mt-1">
//                   {errors.message.message}
//                 </p>
//               )}
//             </div>

//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="flex items-center justify-center cursor-pointer gap-2 w-full bg-white backdrop-blur-sm text-black py-3 rounded-lg font-semibold hover:bg-white/80 transition disabled:opacity-70"
//             >
//               {isSubmitting ? (
//                 <span className="flex items-center gap-2">
//                   <svg
//                     className="animate-spin h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8v8z"
//                     ></path>
//                   </svg>
//                   Sending...
//                 </span>
//               ) : (
//                 <>
//                   <Send className="w-5 h-5" /> Send Message
//                 </>
//               )}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactUs;
