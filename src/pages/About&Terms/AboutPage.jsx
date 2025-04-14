import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white p-8 text-gray-800">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-4xl mx-auto text-center"
      >
        <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-transparent bg-clip-text">
          About Irshadi
        </h1>
        <p className="text-lg text-gray-700 mb-12">
          We’re a team dedicated to simplifying the course registration process for students and faculty. Our mission is to streamline scheduling, reduce registration stress, and empower better academic planning.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        {[ 
          {
            title: "Who We Are",
            desc: "We’re a team dedicated to simplifying course registration for students and faculty."
          },
          {
            title: "Our Story",
            desc: "Frustrated by queues, course conflicts, and limited seats, we built a smarter system to make registration efficient and data-driven."
          },
          {
            title: "What We Do",
            desc: "We simplify input, gather insights, support faculty with data, and save time for all."
          }
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-600">{item.title}</h2>
            <p className="text-gray-600">{item.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="max-w-4xl mx-auto mt-16 space-y-10">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Our Platform</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Simplifying Input: Students select preferred courses easily, with no manual data entry.</li>
            <li>Gathering Insights: Collects course preferences and enrollment data for accurate planning.</li>
            <li>Supporting Faculty: Provides analytics, prioritized student lists, and scheduling recommendations.</li>
            <li>Saving Time: Eliminates in-person visits and reduces wait times for students.</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 2, duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Our Values</h2>
          <ul className="list-disc list-inside text-gray-700">
            <li>Efficiency: We prioritize fast, user-friendly solutions.</li>
            <li>Insight: We believe data drives better decisions.</li>
            <li>Accessibility: Everyone deserves a seamless registration experience.</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Contact Us</h2>
          <p className="text-gray-700">
            Have questions or ideas? Reach out!
          </p>
          <ul className="list-disc list-inside text-gray-700 mt-2">
            <li>Email: <a href="mailto:contact@registrationproject.example.com" className="text-blue-600 underline">Hamooz150@hotmail.com</a></li>
            <li>Social Media: [Link to profiles]</li>
            <li>Get Involved: Share your feedback to help us improve!</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}