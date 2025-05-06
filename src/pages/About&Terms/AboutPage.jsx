import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white p-8 text-gray-700">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className=" text-center"
      >
        <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text">
          About Us
        </h1>
        <p className="text-lg mb-12">
          Irshadi website helps students and faculty members easily manage course registration. It organizes schedules,<br /> makes choosing courses simpler, and helps everyone feel more confident about their semester plans.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-6 max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">Who We Are</h2>
          <p>
            We're a team working on simplifying course registration for students and faculty members.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">Our Story</h2>
          <p>
            Frustrated by long queues, course conflicts, and limited seats, we built a smarter system to make registration efficient and data-driven.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
        >
          <h2 className="text-xl font-semibold mb-2 text-blue-600">What We Do</h2>
          <p>
            We help students register for classes smoothly, provide faculty with the information they need, and make scheduling quicker for everyone.
          </p>
        </motion.div>
      </motion.div>

      <div className="max-w-4xl mx-auto mt-16">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-blue-500 mb-2">Our Platform</h2>
          <ul className="list-disc list-inside mb-10">
            <li>Students upload their academic records in one step.</li>
            <li>They pick next semester's courses with built-in reminders for prerequisites.</li>
            <li>The system flags any missing requirements so graduation stays on track.</li>
            <li>Powered by AI, it automatically builds a conflict-free course timetable.</li>
            <li>Faculty instantly view those course requests and see who needs priority.</li>
            <li>One-click reports show course demand, scheduling gaps, and graduation risks.</li>
            <li>Registration moves fully online—no more long lines or campus visits.</li>
          </ul>

          <h2 className="text-2xl font-bold text-blue-500 mb-2">Our Values</h2>
          <ul className="list-disc list-inside mb-10">
            <li>Efficiency: We build fast, straightforward tools that anyone can use.</li>
            <li>Insight: We turn data into clear guidance so you can plan with confidence.</li>
            <li>Accessibility: We make course registration easy and open to everyone.</li>
          </ul>

          <h2 className="text-2xl font-bold text-blue-500 mb-2">Contact Us</h2>
          <p className="mb-1">
            Have questions or ideas? Reach out!
          </p>
          <ul className="list-disc list-inside">
            <li>Email: <a href="mailto:Hamooz150@hotmail.com" className="text-blue-600 underline">Hamooz150@hotmail.com</a></li>
            <li>Get Involved: Share your feedback to help us improve!</li>
          </ul>
        </motion.div>
      </div>


    </div>
  );
}
export default AboutPage;