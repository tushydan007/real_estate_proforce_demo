import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import toast from "react-hot-toast";

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
      console.log(data)
      toast.success("Message sent successfully 🎉");
      reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white py-12 text-center">
        <h1 className="text-4xl font-bold">Contact Us</h1>
        <p className="mt-2 text-lg">
          We’d love to hear from you. Reach out anytime!
        </p>
      </div>

      {/* Contact Info + Form */}
      <div className="flex flex-col lg:flex-row gap-10 px-6 lg:px-20 py-12">
        {/* Left: Contact Info */}
        <div className="lg:w-1/2 space-y-8">
          <h2 className="text-2xl font-semibold">Our Office</h2>
          <p className="text-gray-600">
            Visit us at our office or connect with us through email or phone.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-600 w-6 h-6" />
              <p>
                1 Akaka Junction, Ode Remo,
                <br /> Ogun State, Nigeria
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-blue-600 w-6 h-6" />
              <p>+234 800 123 4567</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="text-blue-600 w-6 h-6" />
              <p>support@proforcegalaxies.com</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600 w-6 h-6" />
              <p>Mon - Sat: 9:00 AM - 6:00 PM</p>
            </div>
          </div>

          {/* Map */}
          <div className="h-64 w-full rounded-lg overflow-hidden shadow">
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
          </div>
        </div>

        {/* Right: Contact Form */}
        <div className="lg:w-1/2 bg-white shadow-lg rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-semibold">Send us a message</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                {...register("name")}
                placeholder="Your name"
                className="w-full mt-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className="w-full mt-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Message</label>
              <textarea
                rows={5}
                {...register("message")}
                placeholder="Your message..."
                className="w-full mt-1 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              {errors.message && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.message.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70"
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
